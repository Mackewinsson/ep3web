import {
  Field,
  SelectField,
  TextArea,
} from "@/components/panel/ui";

export type DriverFormValues = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  licenseNotes?: string | null;
  active?: boolean;
  kind?: "operator" | "crew";
  operatorId?: string | null;
  enableAppAccess?: boolean;
};

export function DriverFormFields({
  values,
  operatorOptions,
  hasAppAccess = false,
}: {
  values?: DriverFormValues;
  operatorOptions: { id: string; name: string }[];
  hasAppAccess?: boolean;
}) {
  const kind = values?.kind ?? "operator";

  return (
    <>
      <SelectField
        label="Tipo"
        name="kind"
        required
        defaultValue={kind}
        options={[
          { value: "operator", label: "Operador (cuenta flota)" },
          { value: "crew", label: "Conductor de flota" },
        ]}
      />
      <SelectField
        label="Operador dueño (si es conductor de flota)"
        name="operatorId"
        required
        defaultValue={values?.operatorId ?? "none"}
        options={[
          { value: "none", label: "— (solo operadores)" },
          ...operatorOptions.map((o) => ({
            value: o.id,
            label: o.name,
          })),
        ]}
      />
      <p className="text-xs text-ep3-navy/55">
        Los operadores reciben trabajos y eligen camión/conductor al aceptar. Los
        conductores de flota solo aparecen en ese modal.
      </p>
      <Field
        label="Nombre"
        name="name"
        required
        defaultValue={values?.name ?? undefined}
      />
      <Field
        label="Correo"
        name="email"
        type="email"
        required
        defaultValue={values?.email ?? undefined}
      />
      <Field
        label="Teléfono"
        name="phone"
        defaultValue={values?.phone ?? undefined}
      />
      <TextArea
        label="Licencia / notas"
        name="licenseNotes"
        defaultValue={values?.licenseNotes}
      />
      <label className="flex min-h-11 items-center gap-3 text-sm text-ep3-navy">
        <input
          type="checkbox"
          name="active"
          defaultChecked={values?.active ?? true}
          className="h-5 w-5 rounded border-ep3-navy/30"
        />
        Activo
      </label>

      <div className="space-y-3 rounded-md border border-dashed border-ep3-navy/20 p-3">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ep3-navy">
          <input
            type="checkbox"
            name="enableAppAccess"
            defaultChecked={values?.enableAppAccess ?? hasAppAccess}
            className="h-5 w-5 rounded border-ep3-navy/30"
          />
          Acceso de operador (panel)
        </label>
        <p className="text-xs text-ep3-navy/60">
          Solo aplica a operadores. Crea el usuario de panel (mismo correo) para
          Mis trabajos y notificaciones. Los conductores de flota no necesitan
          acceso.
        </p>
        <Field
          label={
            hasAppAccess
              ? "Nueva contraseña (opcional)"
              : "Contraseña de acceso"
          }
          name="appPassword"
          type="password"
          placeholder="Mínimo 6 caracteres"
        />
      </div>
    </>
  );
}
