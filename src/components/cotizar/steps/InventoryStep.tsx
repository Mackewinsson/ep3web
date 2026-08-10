"use client";

import { useState } from "react";
import { CategoryAccordion } from "@/components/cotizar/CategoryAccordion";
import {
  formatM3,
  sumQuantities,
  type MovingCatalog,
} from "@/lib/moving-catalog";
import type { PricingConfig } from "@/lib/quote-pricing";

type Props = {
  catalog: MovingCatalog;
  pricing: PricingConfig;
  quantities: Record<string, number>;
  packingBoxes: number;
  onQuantityChange: (itemId: string, qty: number) => void;
};

export function InventoryStep({
  catalog,
  pricing,
  quantities,
  packingBoxes,
  onQuantityChange,
}: Props) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(
    catalog.categories[0]?.id ?? null,
  );
  const { totalItems, totalM3 } = sumQuantities(quantities, catalog);
  const boxVol = packingBoxes * pricing.boxVolumeM3;
  const displayItems = totalItems + packingBoxes;
  const displayM3 = totalM3 + boxVol;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          ¿Qué llevamos?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Volumen total:{" "}
          <strong>
            {formatM3(displayM3)} m<sup>3</sup>
          </strong>
        </p>
        <p className="text-sm text-slate-600">
          Ítems totales: <strong>{displayItems}</strong>
          {packingBoxes > 0 ? (
            <span className="text-slate-400">
              {" "}
              (incluye {packingBoxes} cajas)
            </span>
          ) : null}
        </p>
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
    </div>
  );
}

export function isInventoryValid(
  quantities: Record<string, number>,
  catalog: MovingCatalog,
): boolean {
  return sumQuantities(quantities, catalog).totalItems > 0;
}
