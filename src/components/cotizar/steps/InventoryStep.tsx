"use client";

import { useState, type FormEvent } from "react";
import { CategoryAccordion } from "@/components/cotizar/CategoryAccordion";
import { ItemQuantityRow } from "@/components/cotizar/ItemQuantityRow";
import {
  sumQuantities,
  type MovingCatalog,
} from "@/lib/moving-catalog";
import type { CustomInventoryItem } from "@/lib/quote-wizard-types";

type Props = {
  catalog: MovingCatalog;
  quantities: Record<string, number>;
  customItems: CustomInventoryItem[];
  onQuantityChange: (itemId: string, qty: number) => void;
  onAddCustomItem: (name: string) => void;
  onCustomQuantityChange: (id: string, qty: number) => void;
  onRemoveCustomItem: (id: string) => void;
};

export function InventoryStep({
  catalog,
  quantities,
  customItems,
  onQuantityChange,
  onAddCustomItem,
  onCustomQuantityChange,
  onRemoveCustomItem,
}: Props) {
  const packagingCategory =
    catalog.categories.find((c) => c.id === "cajas-embalaje") ??
    catalog.categories[0];
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(
    packagingCategory?.id ?? null,
  );
  const [customName, setCustomName] = useState("");
  const { totalItems } = sumQuantities(quantities, catalog);
  const customCount = customItems.reduce((sum, item) => sum + item.quantity, 0);
  const displayItems = totalItems + customCount;

  function handleAddCustom(e: FormEvent) {
    e.preventDefault();
    const name = customName.trim();
    if (name.length < 2) return;
    onAddCustomItem(name);
    setCustomName("");
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-[3.25rem] z-20 -mx-4 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="text-center">
          <h2 className="text-balance text-xl font-bold text-slate-900 sm:text-2xl">
            ¿Qué llevamos?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Ítems seleccionados: <strong>{displayItems}</strong>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {catalog.categories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            quantities={quantities}
            onQuantityChange={onQuantityChange}
            open={openCategoryId === category.id}
            onToggle={() =>
              setOpenCategoryId((current) =>
                current === category.id ? null : category.id,
              )
            }
          />
        ))}
      </div>

      <section className="rounded-xl border border-dashed border-ep3-navy/25 bg-ep3-navy/5 p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-ep3-navy">
          ¿No está en la lista?
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Agrega el nombre del ítem y la cantidad.
        </p>
        <form
          onSubmit={handleAddCustom}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ej: piano vertical, pecera…"
            className="min-h-11 w-full flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-ep3-navy md:text-sm"
            maxLength={120}
          />
          <button
            type="submit"
            disabled={customName.trim().length < 2}
            className="min-h-11 shrink-0 rounded-lg bg-ep3-navy px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-40"
          >
            Agregar
          </button>
        </form>

        {customItems.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {customItems.map((item) => (
              <div key={item.id} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 pr-2">
                  <div className="min-w-0 flex-1">
                    <ItemQuantityRow
                      name={item.name}
                      quantity={item.quantity}
                      onChange={(qty) => onCustomQuantityChange(item.id, qty)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar ${item.name}`}
                    onClick={() => onRemoveCustomItem(item.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="pb-24 sm:pb-0" aria-hidden />
    </div>
  );
}

export function isInventoryValid(
  quantities: Record<string, number>,
  catalog: MovingCatalog,
  customItems: CustomInventoryItem[] = [],
): boolean {
  const catalogCount = sumQuantities(quantities, catalog).totalItems;
  const customCount = customItems.reduce((sum, item) => sum + item.quantity, 0);
  return catalogCount + customCount > 0;
}
