import {
  generateRegistrationOptions,
  RegistrationResponseJSON,
  verifyRegistrationResponse,
  WebAuthnCredential
} from "@simplewebauthn/server";
import {initializeDatabase} from "@/app/lib/database";
import {User} from "@/app/entity/user";
import withSession, {sessionOptions} from "@/app/lib/session";
import {getIronSession} from "iron-session";
import {cookies} from "next/headers";
import {NextApiRequest} from "next";

export async function GET(req: NextApiRequest) {
  await initializeDatabase();
  const session = await getIronSession(cookies(), sessionOptions)

  const {searchParams} = new URL(req.url)
  const username = searchParams.get('username')

  const exists = await User.exists({where: {username: username}})
  if (exists) {
    return Response.json('用户已存在')
  }

  const user = new User()
  user.username = username
  await user.save()
  const options = generateRegistrationOptions({
    rpName: 'WebAuthn Demo',
    rpID: 'localhost',
    userID: user.id,
    userName: user.username,
    attestationType: 'none',
  });

  session.currentChallenge = options.challenge;
  session.user = user;
  await session.save()

  console.log(111111111111111111)
  return Response.json(options)
}

export async function POST(req: Request) {
  const body: RegistrationResponseJSON = await req.body;
  const session = await getIronSession(cookies(), sessionOptions)

  const expectedChallenge = session.currentChallenge;

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: expectedChallenge,
    expectedOrigin: 'http://localhost:7000',
    expectedRPID: 'localhost',
  });

  req.session.currentChallenge = undefined;

  if (!verification.verified) {
    return Response.json({success: false})
  }

  const user = session.user
  session.destroy();

  const credential  = verification.registrationInfo.credential;
  const existingCredential = user.credentials.find((cred) => cred.id === credential.id);
  if (!existingCredential) {
    const newCredential: WebAuthnCredential = {
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: body.response.transports,
    };
    user.credentials.push(newCredential);
    user.save()
  }

  return Response.json({success: true})
}