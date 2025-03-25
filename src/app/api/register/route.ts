import {
  generateRegistrationOptions,
  RegistrationResponseJSON,
  VerifiedRegistrationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import {initializeDatabase} from "@/app/lib/database";
import {User} from "@/app/entity/user";
import {sessionOptions} from "@/app/lib/session";
import {getIronSession} from "iron-session";
import {cookies} from "next/headers";
import {Credential} from "@/app/entity/credential";

export async function GET(req: Request) {
  await initializeDatabase();
  const session = await getIronSession(await cookies(), sessionOptions)

  const {searchParams} = new URL(req.url)
  const username = searchParams.get('username')

  const exists = await User.exists({where: {username: username}})
  let user
  if (!exists) {
    user = new User()
    user.username = username
    user.credentials = []
    await user.save()
  } else {
    user = await User.findOne({where: {username: username}, relations: {credentials: true}})
    if (!user.credentials)
      user.credentials = []
  }

  const options = await generateRegistrationOptions({
    rpName: 'WebAuthn Demo',
    rpID: 'localhost',
    userID: user.id,
    userName: user.username,
    attestationType: 'none',
    excludeCredentials: user.credentials.map((cred) => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'discouraged',
      userVerification: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  session.currentChallenge = options.challenge;
  session.user = user;
  await session.save()

  return Response.json(options)
}

export async function POST(req: Request) {
  const session = await getIronSession(await cookies(), sessionOptions)

  const body: RegistrationResponseJSON = await req.json();

  const expectedChallenge = session.currentChallenge;

  let verification: VerifiedRegistrationResponse
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: expectedChallenge,
      expectedOrigin: 'http://localhost:7000',
      expectedRPID: 'localhost',
      requireUserVerification: false,
    });
  } catch (e) {
    const _e = e as Error;
    console.error(_e);
    return new Response(_e.message, {status: 400})
  }

  if (!verification.verified) {
    return Response.json({success: false})
  }

  const user = User.create(session.user)

  const credential = verification.registrationInfo.credential;
  const existingCredential = user.credentials.find((cred) => cred.id === credential.id);

  if (!existingCredential) { // unnecessary?
    const dbCredential = new Credential()
    dbCredential.credentialId = credential.id
    dbCredential.publicKey = Buffer.from(credential.publicKey).toString('base64url')
    dbCredential.counter = credential.counter
    dbCredential.transports = body.response.transports
    dbCredential.user = user
    user.credentials.push(dbCredential);
    await user.save()
    await dbCredential.save()
  }

  session.destroy();

  return Response.json({success: true})
}