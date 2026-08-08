"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/panel", label: "Dashboard" },
  { href: "/panel/cotizaciones", label: "Cotizaciones" },
  { href: "/panel/presupuestos", label: "Presupuestos" },
  { href: "/panel/trabajos", label: "Trabajos" },
  { href: "/panel/clientes", label: "Clientes" },
  { href: "/panel/conductores", label: "Conductores" },
  { href: "/panel/camiones", label: "Camiones" },
] as const;

export function PanelSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ep3-navy/10 bg-ep3-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ep3-yellow">
          Transportes EP3
        </p>
        <p className="mt-1 text-lg font-semibold">Panel ops</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/panel"
              ? pathname === "/panel"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-ep3-yellow font-semibold text-ep3-navy"
                  : "text-white/85 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="block rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          Ver sitio público
        </Link>
      </div>
    </aside>
  );
}
