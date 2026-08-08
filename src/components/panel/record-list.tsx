"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { EmptyState } from "@/components/panel/ui";

export type RecordItem = {
  id: string;
  href?: string;
  title: string;
  fields: { label: string; value: ReactNode }[];
  badge?: ReactNode;
  action?: ReactNode;
};

function useNavigate(href?: string) {
  const router = useRouter();
  if (!href) {
    return {
      clickable: false as const,
      onClick: undefined,
      onKeyDown: undefined,
    };
  }
  return {
    clickable: true as const,
    onClick: () => router.push(href),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(href);
      }
    },
  };
}

function CardBody({ item }: { item: RecordItem }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ep3-navy">{item.title}</p>
        {item.badge}
      </div>
      <dl className="mt-3 space-y-1.5">
        {item.fields.map((field) => (
          <div
            key={field.label}
            className="flex justify-between gap-3 text-sm"
          >
            <dt className="shrink-0 text-ep3-navy/55">{field.label}</dt>
            <dd className="min-w-0 text-right text-ep3-navy/85">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function MobileCard({ item }: { item: RecordItem }) {
  const nav = useNavigate(item.href);

  return (
    <li
      className={`rounded-lg border border-ep3-navy/10 bg-white/80 transition ${
        nav.clickable
          ? "cursor-pointer hover:border-ep3-navy/25 hover:bg-white hover:shadow-sm active:scale-[0.99]"
          : ""
      }`}
    >
      <div
        role={nav.clickable ? "link" : undefined}
        tabIndex={nav.clickable ? 0 : undefined}
        onClick={nav.onClick}
        onKeyDown={nav.onKeyDown}
        className="p-4 outline-none focus-visible:ring-2 focus-visible:ring-ep3-navy/30"
        aria-label={nav.clickable ? `Abrir ${item.title}` : undefined}
      >
        <CardBody item={item} />
      </div>
      {item.action ? (
        <div
          className="border-t border-ep3-navy/5 px-4 py-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {item.action}
        </div>
      ) : null}
    </li>
  );
}

function DesktopRow({
  item,
  headers,
}: {
  item: RecordItem;
  headers: string[];
}) {
  const nav = useNavigate(item.href);

  return (
    <tr
      role={nav.clickable ? "link" : undefined}
      tabIndex={nav.clickable ? 0 : undefined}
      onClick={nav.onClick}
      onKeyDown={nav.onKeyDown}
      aria-label={nav.clickable ? `Abrir ${item.title}` : undefined}
      className={`border-b border-ep3-navy/5 outline-none focus-visible:bg-ep3-navy/[0.04] ${
        nav.clickable
          ? "cursor-pointer hover:bg-ep3-navy/[0.04]"
          : ""
      }`}
    >
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ep3-navy">{item.title}</span>
          {item.badge}
        </div>
      </td>
      {headers.map((label) => {
        const field = item.fields.find((f) => f.label === label);
        return (
          <td key={label} className="px-3 py-2 text-ep3-navy/80">
            {field?.value}
          </td>
        );
      })}
      <td
        className="px-3 py-2 text-right"
        onClick={(e) => {
          if (item.action) e.stopPropagation();
        }}
      >
        {item.action ?? null}
      </td>
    </tr>
  );
}

export function RecordList({
  items,
  emptyMessage,
}: {
  items: RecordItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const headers = items[0]?.fields.map((f) => f.label) ?? [];

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <MobileCard key={item.id} item={item} />
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ep3-navy/10 text-ep3-navy/70">
              <th className="px-3 py-2 font-medium">Nombre</th>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <DesktopRow key={item.id} item={item} headers={headers} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
