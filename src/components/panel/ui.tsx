import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ep3-navy">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ep3-navy/70">{description}</p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="rounded-md bg-ep3-navy px-4 py-2 text-sm font-medium text-white hover:bg-ep3-navy/90"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PanelCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-ep3-navy/10 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-ep3-navy/60">{message}</p>
  );
}

export function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-ep3-navy/10 text-ep3-navy",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ep3-navy">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2 text-ep3-navy outline-none focus:border-ep3-navy"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ep3-navy">{label}</span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2 text-ep3-navy outline-none focus:border-ep3-navy"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ep3-navy">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2 text-ep3-navy outline-none focus:border-ep3-navy"
      >
        <option value="" disabled>
          Seleccionar…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="rounded-md bg-ep3-yellow px-4 py-2 text-sm font-semibold text-ep3-navy hover:brightness-95"
    >
      {label}
    </button>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ep3-navy/10 text-ep3-navy/70">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
