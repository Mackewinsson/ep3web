import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen bg-[#e8edf4]">
      <PanelSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ep3-navy/10 bg-white px-6 py-3 shadow-sm">
          <p className="text-sm text-ep3-navy/70">
            Operaciones · mudanzas y fletes
          </p>
          <div className="flex items-center gap-3">
            {session ? (
              <span className="hidden text-sm text-ep3-navy/80 sm:inline">
                {session.name}
              </span>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-ep3-navy/15 px-3 py-1.5 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5"
              >
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
