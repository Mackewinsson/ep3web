import { SignInForm } from "@/components/panel/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ep3-navy via-[#00307a] to-ep3-navy px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-ep3-kraft">
            Transportes EP3
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ep3-navy">
            Acceso al panel
          </h1>
          <p className="mt-1 text-sm text-ep3-navy/70">
            Solo personal autorizado
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
