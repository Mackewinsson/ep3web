import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  homePathForRole,
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

export async function requireAdmin(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "admin") {
    redirect(homePathForRole(session.role));
  }
  return session;
}

export async function requireDriver(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "driver" || !session.driverId) {
    redirect(homePathForRole(session.role));
  }
  return session;
}
