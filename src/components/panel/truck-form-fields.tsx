import {
  Field,
  SelectField,
  TextArea,
} from "@/components/panel/ui";

export type TruckFormValues = {
  plate?: string | null;
  label?: string | null;
  capacityNotes?: string | null;
  operatorId?: string | null;
  defaultDriverId?: string | null;
  permisoCirculacionNumber?: string | null;
  permisoCirculacionExpiresAt?: string | null;
  soapPolicyNumber?: string | null;
  soapInsurer?: string | null;
  soapExpiresAt?: string | null;
  revisionTecnicaFolio?: string | null;
  revisionTecnicaExpiresAt?: string | null;
  active?: boolean;
};

export function TruckFormFields({
  values,
  operatorOptions,
  crewOptions,
}: {
  values?: TruckFormValues;
  operatorOptions: { id: string; name: string }[];
  crewOptions: { id: string; name: string; operatorId: string | null }[];
}) {
  const selectedOperatorId = values?.operatorId ?? undefined;
  const habitualOptions = selectedOperatorId
    ? crewOptions.filter((c) => c.operatorId === selectedOperatorId)
    : crewOptions;

  return (
    <>
      <Field
        label="Patente"
        name="plate"
        required
        defaultValue={values?.plate ?? undefined}
        placeholder="ABCD12"
      />
      <Field
        label="Nombre / alias"
        name="label"
        defaultValue={values?.label ?? undefined}
        placeholder="Camión 1"
      />
      <TextArea
        label="Capacidad / notas"
        name="capacityNotes"
        defaultValue={values?.capacityNotes}
      />
      <SelectField
        label="Operador dueño"
        name="operatorId"
        required
        defaultValue={values?.operatorId}
        options={operatorOptions.map((o) => ({
          value: o.id,
          label: o.name,
        }))}
      />
      <p className="text-xs text-ep3-navy/55">
        Solo administración asigna camiones a un operador. El operador elige
        cuál usar al aceptar cada servicio.
      </p>
      <SelectField
        label="Conductor habitual (opcional)"
        name="defaultDriverId"
        required
        defaultValue={values?.defaultDriverId ?? "none"}
        options={[
          { value: "none", label: "Sin conductor habitual" },
          ...habitualOptions.map((d) => ({
            value: d.id,
            label: d.name,
          })),
        ]}
      />

      <div className="space-y-3 border-t border-ep3-navy/10 pt-4">
        <h3 className="text-sm font-semibold text-ep3-navy">
          Permiso de circulación
        </h3>
        <Field
          label="Número / comuna"
          name="permisoCirculacionNumber"
          defaultValue={values?.permisoCirculacionNumber ?? undefined}
          placeholder="Ej. Santiago 2026"
        />
        <Field
          label="Vigente hasta"
          name="permisoCirculacionExpiresAt"
          type="date"
          defaultValue={values?.permisoCirculacionExpiresAt ?? undefined}
        />
      </div>

      <div className="space-y-3 border-t border-ep3-navy/10 pt-4">
        <h3 className="text-sm font-semibold text-ep3-navy">SOAP</h3>
        <Field
          label="Nº póliza"
          name="soapPolicyNumber"
          defaultValue={values?.soapPolicyNumber ?? undefined}
        />
        <Field
          label="Compañía"
          name="soapInsurer"
          defaultValue={values?.soapInsurer ?? undefined}
        />
        <Field
          label="Vigente hasta"
          name="soapExpiresAt"
          type="date"
          defaultValue={values?.soapExpiresAt ?? undefined}
        />
      </div>

      <div className="space-y-3 border-t border-ep3-navy/10 pt-4">
        <h3 className="text-sm font-semibold text-ep3-navy">
          Revisión técnica
        </h3>
        <Field
          label="Folio / certificado"
          name="revisionTecnicaFolio"
          defaultValue={values?.revisionTecnicaFolio ?? undefined}
        />
        <Field
          label="Vigente hasta"
          name="revisionTecnicaExpiresAt"
          type="date"
          defaultValue={values?.revisionTecnicaExpiresAt ?? undefined}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ep3-navy">
        <input
          type="checkbox"
          name="active"
          defaultChecked={values?.active ?? true}
        />
        Activo
      </label>
    </>
  );
}
