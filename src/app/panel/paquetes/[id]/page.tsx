import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { servicePackages } from "@/db/schema";
import { updatePackage } from "@/lib/actions/packages";

type Props = { params: Promise<{ id: string }> };

export default async function PaqueteDetailPage({ params }: Props) {
  const { id } = await params;
  const [pkg] = await db
    .select()
    .from(servicePackages)
    .where(eq(servicePackages.id, id))
    .limit(1);
  if (!pkg) notFound();

  const action = updatePackage.bind(null, id);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href="/panel/paquetes" label="Volver a paquetes" />
      <PageHeader title={pkg.name} description="Editar paquete" />
      <PanelCard>
        <form action={action} className="space-y-4">
          <Field label="Nombre" name="name" required defaultValue={pkg.name} />
          <Field label="Slug (URL)" name="slug" defaultValue={pkg.slug} />
          <Field
            label="Resumen corto"
            name="shortDescription"
            defaultValue={pkg.shortDescription}
          />
          <TextArea
            label="Descripción"
            name="description"
            defaultValue={pkg.description}
          />
          <SelectField
            label="Tipo de precio"
            name="pricingType"
            required
            defaultValue={pkg.pricingType}
            options={[
              { value: "fixed", label: "Precio fijo" },
              { value: "m3", label: "Por m³" },
              { value: "unit", label: "Por unidad / elemento" },
            ]}
          />
          <Field
            label="Precio base (CLP)"
            name="basePrice"
            type="number"
            step="1"
            required
            defaultValue={pkg.basePrice}
          />
          <Field
            label="m³ incluidos (opcional)"
            name="includedM3"
            type="number"
            step="0.1"
            defaultValue={pkg.includedM3 ?? undefined}
          />
          <Field
            label="Unidades incluidas (opcional)"
            name="includedUnits"
            type="number"
            step="1"
            defaultValue={pkg.includedUnits ?? undefined}
          />
          <TextArea
            label="Incluye (una línea por ítem)"
            name="highlights"
            defaultValue={pkg.highlights}
            rows={4}
          />
          <Field
            label="Orden"
            name="sortOrder"
            type="number"
            defaultValue={pkg.sortOrder}
          />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked={pkg.active} />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input
              type="checkbox"
              name="showOnHome"
              defaultChecked={pkg.showOnHome}
            />
            Mostrar en la home
          </label>
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
