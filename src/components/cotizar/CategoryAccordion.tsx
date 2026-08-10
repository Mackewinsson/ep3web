"use client";

import type { CatalogCategory } from "@/lib/moving-catalog";
import { ItemQuantityRow } from "@/components/cotizar/ItemQuantityRow";

type Props = {
  category: CatalogCategory;
  quantities: Record<string, number>;
  onQuantityChange: (itemId: string, qty: number) => void;
  open: boolean;
  onToggle: () => void;
};

export function CategoryAccordion({
  category,
  quantities,
  onQuantityChange,
  open,
  onToggle,
}: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-3 text-left sm:px-4"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="min-w-0 text-sm font-semibold text-slate-900">
          {category.name}
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-5 w-5 shrink-0 text-ep3-navy transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-slate-100">
          {category.items.map((item) => (
            <ItemQuantityRow
              key={item.id}
              name={item.name}
              quantity={quantities[item.id] ?? 0}
              onChange={(qty) => onQuantityChange(item.id, qty)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
