"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import {
  homePathForRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Email o contraseña inválidos" };
  }

  const [user] = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.email, parsed.data.email))
    .limit(1);

  if (!user || !user.active) {
    return { error: "Credenciales incorrectas" };
  }

  if (user.role === "driver" && !user.driverId) {
    return { error: "Cuenta de camionero sin conductor vinculado" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Credenciales incorrectas" };
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    driverId: user.driverId,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());

  redirect(homePathForRole(user.role));
}

export async function logoutAction() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  redirect("/sign-in");
}
