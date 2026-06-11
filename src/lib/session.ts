import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: number;       // effective data-owner id (what queries scope by)
  userName?: string;     // signed-in user's display name
  actualUserId?: number; // who actually logged in (= userId for owners, helper's id for helpers)
  role?: "owner" | "helper";
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "mb_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
