"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ep3-navy">Correo</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2 text-ep3-navy outline-none focus:border-ep3-navy"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ep3-navy">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2 text-ep3-navy outline-none focus:border-ep3-navy"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ep3-yellow px-4 py-2.5 text-sm font-semibold text-ep3-navy hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
