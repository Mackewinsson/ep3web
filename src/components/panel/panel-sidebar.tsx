"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { StaffRole } from "@/lib/auth/constants";

const ADMIN_NAV = [
  { href: "/panel", label: "Inicio" },
  { href: "/panel/cotizaciones", label: "Cotizaciones" },
  { href: "/panel/presupuestos", label: "Presupuestos" },
  { href: "/panel/trabajos", label: "Trabajos" },
  { href: "/panel/paquetes", label: "Paquetes" },
  { href: "/panel/clientes", label: "Clientes" },
  { href: "/panel/conductores", label: "Conductores" },
  { href: "/panel/camiones", label: "Camiones" },
] as const;

const DRIVER_NAV = [
  { href: "/panel/mis-trabajos", label: "Mis trabajos" },
] as const;

function NavLinks({
  role,
  onNavigate,
}: {
  role: StaffRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = role === "driver" ? DRIVER_NAV : ADMIN_NAV;

  return (
    <>
      {items.map((item) => {
        const active =
          item.href === "/panel"
            ? pathname === "/panel"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex min-h-11 items-center rounded-md px-3 py-2 text-sm transition ${
              active
                ? "bg-ep3-yellow font-semibold text-ep3-navy"
                : "text-white/85 hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function SidebarBrand({ role }: { role: StaffRole }) {
  return (
    <div className="border-b border-white/10 px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ep3-yellow">
        Transportes EP3
      </p>
      <p className="mt-1 text-lg font-semibold">
        {role === "driver" ? "Mis viajes" : "Panel operativo"}
      </p>
    </div>
  );
}

export function PanelShell({
  children,
  userName,
  role = "admin",
  logoutAction,
}: {
  children: React.ReactNode;
  userName?: string | null;
  role?: StaffRole;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const firstName = userName?.split(" ")[0];
  const subtitle =
    role === "driver"
      ? "Tus mudanzas y fletes asignados"
      : "Operaciones · mudanzas y fletes";

  return (
    <div className="panel-surface flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ep3-navy/20 bg-ep3-navy text-white shadow-[8px_0_28px_-12px_rgb(0_31_84_/_0.45)] md:flex">
        <SidebarBrand role={role} />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLinks role={role} />
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Ver sitio público
          </Link>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ep3-navy/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-ep3-navy text-white shadow-xl">
            <div className="relative border-b border-white/10 px-5 py-5 pr-12">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ep3-yellow">
                Transportes EP3
              </p>
              <p className="mt-1 text-lg font-semibold">
                {role === "driver" ? "Mis viajes" : "Panel operativo"}
              </p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 rounded-md p-2 text-white/80 hover:bg-white/10"
              >
                <span className="block text-xl leading-none">×</span>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              <NavLinks role={role} onNavigate={() => setOpen(false)} />
            </nav>
            <div className="border-t border-white/10 p-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Ver sitio público
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ep3-navy/10 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ep3-navy/15 text-ep3-navy md:hidden"
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 bg-ep3-navy" />
                <span className="block h-0.5 w-5 bg-ep3-navy" />
                <span className="block h-0.5 w-5 bg-ep3-navy" />
              </span>
            </button>
            <p className="text-sm text-ep3-navy/70">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {firstName ? (
              <span className="text-sm text-ep3-navy/80">{firstName}</span>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-ep3-navy/15 px-3 py-2 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5"
              >
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
