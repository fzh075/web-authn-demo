import {NextApiRequest} from "next";
import {getIronSession, SessionOptions} from "iron-session";
import {cookies} from "next/headers";

export const sessionOptions: SessionOptions = {
  password: 'your-secret-key-at-least-32-characters-long',
  cookieName: 'user-login',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}