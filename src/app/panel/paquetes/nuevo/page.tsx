import {
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { createPackage } from "@/lib/actions/packages";

export default function NuevoPaquetePage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nuevo paquete"
        description="Ej: Mudanza depto 1D, Flete por m³, Pack express"
      />
      <PanelCard>
        <form action={createPackage} className="space-y-4">
          <Field label="Nombre" name="name" required placeholder="Mudanza 1 dormitorio" />
          <Field
            label="Slug (URL)"
            name="slug"
            placeholder="Se genera solo si lo dejas vacío"
          />
          <Field
            label="Resumen corto"
            name="shortDescription"
            placeholder="Ideal para departamentos pequeños"
          />
          <TextArea label="Descripción" name="description" rows={3} />
          <SelectField
            label="Tipo de precio"
            name="pricingType"
            required
            defaultValue="fixed"
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
            defaultValue={0}
          />
          <Field
            label="m³ incluidos (opcional)"
            name="includedM3"
            type="number"
            step="0.1"
          />
          <Field
            label="Unidades incluidas (opcional)"
            name="includedUnits"
            type="number"
            step="1"
          />
          <TextArea
            label="Incluye (una línea por ítem)"
            name="highlights"
            rows={4}
          />
          <Field label="Orden" name="sortOrder" type="number" defaultValue={0} />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="showOnHome" defaultChecked />
            Mostrar en la home
          </label>
          <SubmitButton label="Guardar paquete" />
        </form>
      </PanelCard>
    </div>
  );
}
