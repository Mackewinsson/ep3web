export type PropertyType = "casa" | "departamento" | "oficina";

export type ParkingOption = "near" | "far" | "underground";

export type AddressBlock = {
  propertyType: PropertyType | "";
  address: string;
  /** Only used when propertyType === "departamento" */
  floor: string;
  /** Only used when propertyType === "departamento" */
  hasElevator: boolean | null;
};

export type CustomInventoryItem = {
  id: string;
  name: string;
  quantity: number;
};

export type QuoteWizardState = {
  origin: AddressBlock;
  destination: AddressBlock;
  /** itemId -> quantity */
  quantities: Record<string, number>;
  /** Extra items the client typed that are not in the catalog */
  customItems: CustomInventoryItem[];
  packingBoxes: number;
  boxesPromptSeen: boolean;
  hasFragile: boolean | null;
  fragileNotes: string;
  parkingOrigin: ParkingOption | "";
  parkingDestination: ParkingOption | "";
  contact: {
    name: string;
    phone: string;
    email: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  };
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  oficina: "Oficina",
};

export const PARKING_LABELS: Record<ParkingOption, string> = {
  near: "Sí, a menos de 40 metros",
  far: "No, a más de 40 metros",
  underground: "No, la entrada es por subterráneo",
};

export function createInitialQuoteState(): QuoteWizardState {
  return {
    origin: {
      propertyType: "",
      address: "",
      floor: "",
      hasElevator: null,
    },
    destination: {
      propertyType: "",
      address: "",
      floor: "",
      hasElevator: null,
    },
    quantities: {},
    customItems: [],
    packingBoxes: 0,
    boxesPromptSeen: false,
    hasFragile: null,
    fragileNotes: "",
    parkingOrigin: "",
    parkingDestination: "",
    contact: {
      name: "",
      phone: "",
      email: "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
    },
  };
}
