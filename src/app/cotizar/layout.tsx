import Image from "next/image";
import Link from "next/link";
import theme from "@/theme.json";

const { navy, yellow } = theme.colors;

export default function CotizarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: navy, borderColor: `${navy}cc` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
          <Link href="/" className="min-w-0 shrink">
            <Image
              src="/logo.png"
              alt="Transportes EP3"
              width={160}
              height={62}
              className="h-9 w-auto sm:h-10 md:h-12"
              priority
            />
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full px-3 py-2 text-xs font-bold transition hover:brightness-110 sm:px-4 sm:text-sm"
            style={{ background: yellow, color: navy }}
          >
            <span className="sm:hidden">Inicio</span>
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 sm:pb-10 sm:pt-8 md:px-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
