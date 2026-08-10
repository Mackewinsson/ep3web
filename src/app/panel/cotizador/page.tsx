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
      }
    : DEFAULT_PRICING_CONFIG;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cotizador web"
        description="Parámetros de volumen, cajas y precio usados en /cotizar. Solo admin."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Cálculo (fuente única)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Lógica en <code className="text-xs">src/lib/quote-pricing/</code>.
          Estos valores alimentan esa lógica.
        </p>
        <form
          action={updateQuotePricingSettings}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">Cajas por m³</span>
            <input
              name="boxesPerM3"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={cfg.boxesPerM3}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Mínimo de cajas</span>
            <input
              name="minBoxes"
              type="number"
              min="0"
              defaultValue={cfg.minBoxes}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Volumen por caja (m³)</span>
            <input
              name="boxVolumeM3"
              type="number"
              step="0.001"
              min="0.001"
              defaultValue={cfg.boxVolumeM3}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Precio por m³ (CLP)</span>
            <input
              name="pricePerM3"
              type="number"
              min="0"
              step="1"
              defaultValue={cfg.pricePerM3}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">
              Recargo piso sin ascensor (CLP)
            </span>
            <input
              name="noElevatorPerFloor"
              type="number"
              min="0"
              step="1"
              defaultValue={cfg.noElevatorPerFloor}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full bg-ep3-navy px-5 py-2.5 text-sm font-bold text-ep3-yellow"
            >
              Guardar parámetros
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Nueva categoría
        </h2>
        <form
          action={createMovingCategory}
          className="mt-3 flex flex-wrap gap-3"
        >
          <input
            name="name"
            placeholder="Nombre categoría"
            required
            className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full border border-ep3-navy px-4 py-2 text-sm font-semibold text-ep3-navy"
          >
            Agregar categoría
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Nuevo ítem</h2>
        <form
          action={createMovingCatalogItem}
          className="mt-3 grid gap-3 sm:grid-cols-4"
        >
          <select
            name="categoryId"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="volumeM3"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="m³"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-ep3-yellow px-4 py-2 text-sm font-bold text-ep3-navy sm:col-span-4 sm:w-fit"
          >
            Agregar ítem
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Catálogo</h2>
        {categories.map((category) => {
          const catItems = items.filter((i) => i.categoryId === category.id);
          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold">
                {category.name}{" "}
                <span className="font-normal text-slate-400">
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
                        className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        name="volumeM3"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={Number(item.volumeM3)}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
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
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          item.active
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                  </li>
                ))}
                {!catItems.length ? (
                  <li className="px-4 py-3 text-sm text-slate-400">
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
