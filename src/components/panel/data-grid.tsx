import type { ReactNode } from "react";

/**
 * Spreadsheet-like table primitives for admin item lists.
 * Presentational only: no data access, no business rules.
 */

export const gridCell = {
  head: "whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ep3-navy/55",
  body: "px-3 py-1.5 align-middle text-ep3-navy",
  num: "px-3 py-1.5 align-middle text-right tabular-nums text-ep3-navy",
  /** Borderless until hovered/focused, like a spreadsheet cell. */
  input:
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-ep3-navy outline-none hover:border-ep3-navy/15 focus:border-ep3-navy focus:bg-white",
  inputNum:
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-ep3-navy outline-none hover:border-ep3-navy/15 focus:border-ep3-navy focus:bg-white",
} as const;

export const gridButton = {
  primary:
    "inline-flex min-h-9 items-center justify-center rounded-md bg-ep3-navy px-3 text-xs font-semibold text-white hover:bg-ep3-navy/90",
  accent:
    "inline-flex min-h-9 items-center justify-center rounded-md bg-ep3-yellow px-3 text-xs font-semibold text-ep3-navy hover:brightness-95",
  ghost:
    "inline-flex min-h-9 items-center justify-center rounded-md border border-ep3-navy/15 px-3 text-xs font-medium text-ep3-navy hover:bg-ep3-navy/5",
  danger:
    "inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50",
  iconDanger:
    "inline-flex size-9 items-center justify-center rounded-md text-sm text-ep3-navy/35 hover:bg-red-50 hover:text-red-700",
} as const;

export type GridStat = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
};

export function GridCard({
  title,
  description,
  actions,
  stats,
  children,
  footer,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: GridStat[];
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-5">
        <div>
          <h2 className="text-base font-semibold text-ep3-navy">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-ep3-navy/60">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>

      {stats && stats.length > 0 ? (
        <dl className="grid grid-cols-2 gap-px border-y border-ep3-navy/10 bg-ep3-navy/10 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`px-4 py-3 ${
                stat.tone === "warning" ? "bg-amber-50" : "bg-white"
              }`}
            >
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ep3-navy/50">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ep3-navy">
                {stat.value}
              </dd>
              {stat.hint ? (
                <dd
                  className={`text-xs ${
                    stat.tone === "warning"
                      ? "text-amber-800"
                      : "text-ep3-navy/50"
                  }`}
                >
                  {stat.hint}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}

      <div className="overflow-x-auto">{children}</div>

      {footer ? (
        <div className="border-t border-ep3-navy/10 bg-ep3-navy/[0.02] px-4 py-3 md:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function GridSectionRow({
  label,
  colSpan,
  hint,
}: {
  label: string;
  colSpan: number;
  hint?: string;
}) {
  return (
    <tr className="bg-ep3-navy/[0.04]">
      <td
        colSpan={colSpan}
        className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ep3-navy/60"
      >
        {label}
        {hint ? (
          <span className="ml-2 font-normal normal-case tracking-normal text-ep3-navy/45">
            {hint}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

export function GridEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-3 py-8 text-center text-sm text-ep3-navy/55"
      >
        {message}
      </td>
    </tr>
  );
}
