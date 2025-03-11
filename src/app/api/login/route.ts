import {generateAuthenticationOptions, verifyAuthenticationResponse} from "@simplewebauthn/server";

export async function GET() {
  const options = generateAuthenticationOptions({
    rpID: 'localhost',
  });

  return Response.json(options)
}

export async function POST(request) {
  const body = await request.json();
  const { credential } = body;

  const verification = await verifyAuthenticationResponse({
    credential,
    expectedChallenge: 'challenge', // 替换为实际的挑战值
    expectedOrigin: 'http://localhost:7000',
    expectedRPID: 'localhost',
  });

  if (verification.verified) {
    return Response.json({ success: true })
  } else {
    return Response.json({ success: false })
  }
}