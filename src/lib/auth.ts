import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "./auth/session";

export type StaffSession = SessionPayload;

export async function getSession(): Promise<StaffSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireStaff(): Promise<StaffSession> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
