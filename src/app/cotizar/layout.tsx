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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header
        className="border-b"
        style={{ background: navy, borderColor: `${navy}cc` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Transportes EP3"
              width={160}
              height={62}
              className="h-10 w-auto md:h-12"
              priority
            />
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-110"
            style={{ background: yellow, color: navy }}
          >
            Volver al inicio
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
