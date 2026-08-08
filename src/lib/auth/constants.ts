export const SESSION_COOKIE = "ep3_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type StaffRole = "admin" | "driver";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: StaffRole;
  driverId?: string | null;
};
