"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { NotificationBell } from "@/components/panel/notification-bell";
import {
  useBodyScrollLock,
  useEscapeKey,
} from "@/components/panel/use-overlay";
import type { StaffRole } from "@/lib/auth/constants";
import type { NotificationDto } from "@/lib/notifications";

const ADMIN_NAV = [
  { href: "/panel", label: "Inicio" },
  { href: "/panel/cotizaciones", label: "Cotizaciones" },
  { href: "/panel/presupuestos", label: "Presupuestos" },
  { href: "/panel/trabajos", label: "Trabajos" },
  { href: "/panel/cotizador", label: "Cotizador web" },
  { href: "/panel/paquetes", label: "Paquetes" },
  { href: "/panel/clientes", label: "Clientes" },
  { href: "/panel/conductores", label: "Operadores" },
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
  notifications = [],
  unreadCount = 0,
}: {
  children: React.ReactNode;
  userName?: string | null;
  role?: StaffRole;
  logoutAction: () => Promise<void>;
  notifications?: NotificationDto[];
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(pathname);
  const closeMenu = useCallback(() => setOpen(false), []);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (open) setOpen(false);
  }

  useBodyScrollLock(open);
  useEscapeKey(open, closeMenu);

  const firstName = userName?.split(" ")[0];
  const subtitle =
    role === "driver"
      ? "Tus mudanzas y fletes asignados"
      : "Operaciones · mudanzas y fletes";

  return (
    <div className="panel-surface flex min-h-dvh min-h-screen">
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
            onClick={closeMenu}
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-ep3-navy text-white shadow-xl pb-[env(safe-area-inset-bottom)]">
            <div className="relative border-b border-white/10 px-5 py-5 pr-14 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ep3-yellow">
                Transportes EP3
              </p>
              <p className="mt-1 text-lg font-semibold">
                {role === "driver" ? "Mis viajes" : "Panel operativo"}
              </p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={closeMenu}
                className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white/80 hover:bg-white/10"
              >
                <span className="block text-2xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              <NavLinks role={role} onNavigate={closeMenu} />
            </nav>
            <div className="border-t border-white/10 p-3">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Ver sitio público
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-ep3-navy/10 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm pt-[max(0.625rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:gap-3 md:px-6 md:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-ep3-navy/15 text-ep3-navy md:hidden"
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 bg-ep3-navy" />
                <span className="block h-0.5 w-5 bg-ep3-navy" />
                <span className="block h-0.5 w-5 bg-ep3-navy" />
              </span>
            </button>
            <p className="hidden truncate text-sm text-ep3-navy/70 sm:block">
              {subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <NotificationBell
              initialItems={notifications}
              unreadCount={unreadCount}
            />
            {firstName ? (
              <span className="hidden max-w-[7rem] truncate text-sm text-ep3-navy/80 sm:inline">
                {firstName}
              </span>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-md border border-ep3-navy/15 px-3 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5"
              >
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
