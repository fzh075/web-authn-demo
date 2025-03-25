import {
  AuthenticationResponseJSON,
  generateAuthenticationOptions,
  VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
  WebAuthnCredential
} from "@simplewebauthn/server";
import {initializeDatabase} from "@/app/lib/database";
import {getIronSession} from "iron-session";
import {cookies} from "next/headers";
import {sessionOptions} from "@/app/lib/session";
import {User} from "@/app/entity/user";
import {Credential} from "@/app/entity/credential";

export async function GET(req: Request) {
  await initializeDatabase();
  const session = await getIronSession(await cookies(), sessionOptions)

  const {searchParams} = new URL(req.url)
  const username = searchParams.get('username')

  const exists = await User.exists({where: {username: username}})
  if (!exists)
    return new Response('User not exist', {status: 400})

  const user = await User.findOne({where: {username: username}, relations: {credentials: true}})
  const options = await generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials: user.credentials.map((cred) => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'preferred',
    rpID: 'localhost',
  });

  session.currentChallenge = options.challenge;
  session.user = user;
  await session.save()

  return Response.json(options)
}

export async function POST(req: Request) {
  const session = await getIronSession(await cookies(), sessionOptions)

  const body: AuthenticationResponseJSON = await req.json();

  const expectedChallenge = session.currentChallenge;

  const user = User.create(session.user)
  const dbCredential = await Credential.findOne({where: {user: user, credentialId: body.id}, relations: {user: true}})
  if (!dbCredential)
    return new Response('Authenticator is not registered with this site', {status: 400})
  let credential: WebAuthnCredential | undefined = {}
  credential.id = dbCredential.credentialId
  // credential.publicKey = new Uint8Array(Buffer.from(dbCredential.publicKey, 'base64url'))
  credential.publicKey = Buffer.from(dbCredential.publicKey, 'base64url')
  credential.counter = dbCredential.counter
  credential.transports = dbCredential.transports
  credential.user = dbCredential.user

  let verification: VerifiedAuthenticationResponse
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: expectedChallenge,
      expectedOrigin: 'http://localhost:7000',
      expectedRPID: 'localhost',
      credential,
      requireUserVerification: false,
    });
  } catch (e) {
    const _e = e as Error;
    console.error(_e);
    return new Response(_e.message, {status: 400})
  }

  if (verification.verified) {
    dbCredential.counter = verification.authenticationInfo.newCounter
    await dbCredential.save()
  }

  if (!verification.verified) {
    return Response.json({success: false})
  }

  session.destroy()

  return Response.json({success: true})
}