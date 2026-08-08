import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/panel/ui";

export type RecordItem = {
  id: string;
  href?: string;
  title: string;
  fields: { label: string; value: ReactNode }[];
  badge?: ReactNode;
  action?: ReactNode;
};

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
          <li
            key={item.id}
            className="rounded-lg border border-ep3-navy/10 bg-white/80 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="font-medium text-ep3-navy hover:underline"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="font-medium text-ep3-navy">{item.title}</p>
              )}
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
            {item.action ? (
              <div className="mt-3 border-t border-ep3-navy/5 pt-3">
                {item.action}
              </div>
            ) : null}
          </li>
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
              <tr key={item.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="font-medium text-ep3-navy hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-ep3-navy">
                        {item.title}
                      </span>
                    )}
                    {item.badge}
                  </div>
                </td>
                {item.fields.map((field) => (
                  <td key={field.label} className="px-3 py-2 text-ep3-navy/80">
                    {field.value}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  {item.action ??
                    (item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-ep3-navy underline"
                      >
                        Abrir
                      </Link>
                    ) : null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
