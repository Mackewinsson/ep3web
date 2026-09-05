import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/panel/ui";
import {
  createMovingCatalogItem,
  createMovingCategory,
  toggleMovingCatalogItem,
  updateMovingCatalogItem,
  updateQuotePricingSettings,
} from "@/lib/actions/quote-catalog";
import { db } from "@/db";
import {
  movingCatalogItems,
  movingCategories,
  quotePricingSettings,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_PRICING_CONFIG } from "@/lib/quote-pricing";

const fieldClass =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none placeholder:text-ep3-navy/45 focus:border-ep3-navy md:text-sm";

const labelClass = "mb-1 block text-sm font-medium text-ep3-navy";

export default async function CotizadorAdminPage() {
  await requireAdmin();

  const [settings] = await db.select().from(quotePricingSettings).limit(1);
  const categories = await db
    .select()
    .from(movingCategories)
    .orderBy(asc(movingCategories.sortOrder));
  const items = await db
    .select()
    .from(movingCatalogItems)
    .orderBy(asc(movingCatalogItems.sortOrder));

  const cfg = settings
    ? {
        boxesPerM3: Number(settings.boxesPerM3),
        minBoxes: settings.minBoxes,
        boxVolumeM3: Number(settings.boxVolumeM3),
        pricePerM3: Number(settings.pricePerM3),
        noElevatorPerFloor: Number(settings.noElevatorPerFloor),
        operatorMarginPercent: Number.isFinite(
          Number(settings.operatorMarginPercent),
        )
          ? Number(settings.operatorMarginPercent)
          : DEFAULT_PRICING_CONFIG.operatorMarginPercent,
      }
    : DEFAULT_PRICING_CONFIG;

  return (
    <div className="space-y-8 text-ep3-navy">
      <PageHeader
        title="Cotizador web"
        description="Parámetros de volumen, cajas y precio usados en /cotizar. Solo admin."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ep3-navy">
          Cálculo (fuente única)
        </h2>
        <p className="mt-1 text-sm text-ep3-navy/65">
          Lógica en <code className="text-xs">src/lib/quote-pricing/</code>.
          Estos valores alimentan esa lógica.
        </p>
        <form
          action={updateQuotePricingSettings}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block">
            <span className={labelClass}>Cajas por m³</span>
            <input
              name="boxesPerM3"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={cfg.boxesPerM3}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Mínimo de cajas</span>
            <input
              name="minBoxes"
              type="number"
              min="0"
              defaultValue={cfg.minBoxes}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Volumen por caja (m³)</span>
            <input
              name="boxVolumeM3"
              type="number"
              step="0.001"
              min="0.001"
              defaultValue={cfg.boxVolumeM3}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Precio por m³ (CLP)</span>
            <input
              name="pricePerM3"
              type="number"
              min="0"
              step="1"
              defaultValue={cfg.pricePerM3}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Recargo piso sin ascensor (CLP)</span>
            <input
              name="noElevatorPerFloor"
              type="number"
              min="0"
              step="1"
              defaultValue={cfg.noElevatorPerFloor}
              className={fieldClass}
              required
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>
              Comisión de la app para el operador (%)
            </span>
            <input
              name="operatorMarginPercent"
              type="number"
              min="0"
              max="90"
              step="1"
              defaultValue={cfg.operatorMarginPercent}
              className={fieldClass}
              required
            />
            <span className="mt-1 block text-xs text-ep3-navy/55">
              Del precio cotizado, la app se queda este %. El operador ve el{" "}
              {100 - cfg.operatorMarginPercent}% (ej. $100.000 → $
              {Math.round(
                (100000 * (100 - cfg.operatorMarginPercent)) / 100,
              ).toLocaleString("es-CL")}
              ). Nunca ve el total del cliente.
            </span>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ep3-navy px-5 py-2.5 text-sm font-bold text-ep3-yellow sm:w-auto"
            >
              Guardar parámetros
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ep3-navy">
          Nueva categoría
        </h2>
        <form
          action={createMovingCategory}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <input
            name="name"
            placeholder="Nombre categoría"
            required
            aria-label="Nombre categoría"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ep3-navy px-4 text-sm font-semibold text-ep3-navy sm:w-auto"
          >
            Agregar categoría
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ep3-navy">Nuevo ítem</h2>
        <form
          action={createMovingCatalogItem}
          className="mt-3 grid gap-3 sm:grid-cols-4"
        >
          <select
            name="categoryId"
            required
            aria-label="Categoría"
            className={`${fieldClass} sm:col-span-2`}
            defaultValue=""
          >
            <option value="" disabled>
              Categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="name"
            placeholder="Nombre ítem"
            required
            aria-label="Nombre ítem"
            className={fieldClass}
          />
          <input
            name="volumeM3"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="m³"
            required
            aria-label="Volumen en m³"
            className={fieldClass}
          />
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ep3-yellow px-4 text-sm font-bold text-ep3-navy sm:col-span-4 sm:w-fit"
          >
            Agregar ítem
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ep3-navy">Catálogo</h2>
        {categories.map((category) => {
          const catItems = items.filter((i) => i.categoryId === category.id);
          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-ep3-navy">
                {category.name}{" "}
                <span className="font-normal text-ep3-navy/50">
                  ({catItems.length})
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {catItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <form
                      action={updateMovingCatalogItem.bind(null, item.id)}
                      className="flex flex-1 flex-wrap items-center gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={item.name}
                        aria-label="Nombre del ítem"
                        className={`min-w-0 flex-1 basis-full sm:basis-auto ${fieldClass}`}
                      />
                      <input
                        name="volumeM3"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={Number(item.volumeM3)}
                        aria-label="Volumen m³"
                        className={`w-full sm:w-24 ${fieldClass}`}
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-md border border-ep3-navy/20 px-3 text-sm font-semibold text-ep3-navy"
                      >
                        Guardar
                      </button>
                    </form>
                    <form
                      action={toggleMovingCatalogItem.bind(
                        null,
                        item.id,
                        !item.active,
                      )}
                    >
                      <button
                        type="submit"
                        className={`inline-flex min-h-11 w-full items-center justify-center rounded-md px-3 text-sm font-semibold sm:w-auto ${
                          item.active
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-ep3-navy/55"
                        }`}
                      >
                        {item.active ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                  </li>
                ))}
                {!catItems.length ? (
                  <li className="px-4 py-3 text-sm text-ep3-navy/50">
                    Sin ítems
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
