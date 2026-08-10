"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BoxesSuggestModal } from "@/components/cotizar/BoxesSuggestModal";
import {
  AddressStep,
  isAddressValid,
} from "@/components/cotizar/steps/AddressStep";
import {
  ContactStep,
  isContactValid,
} from "@/components/cotizar/steps/ContactStep";
import {
  FragileStep,
  isFragileValid,
} from "@/components/cotizar/steps/FragileStep";
import {
  InventoryStep,
  isInventoryValid,
} from "@/components/cotizar/steps/InventoryStep";
import {
  isParkingValid,
  ParkingStep,
} from "@/components/cotizar/steps/ParkingStep";
import { SummaryStep } from "@/components/cotizar/steps/SummaryStep";
import {
  suggestBoxes,
  sumQuantities,
  type MovingCatalog,
} from "@/lib/moving-catalog";
import type { PricingConfig } from "@/lib/quote-pricing";
import {
  createInitialQuoteState,
  type AddressBlock,
  type QuoteWizardState,
} from "@/lib/quote-wizard-types";

const STORAGE_KEY = "ep3-quote-wizard-v2";

function normalizeAddress(block: Partial<AddressBlock> | undefined): AddressBlock {
  return {
    propertyType: block?.propertyType ?? "",
    address: block?.address ?? "",
    floor: block?.floor ?? "",
    hasElevator:
      typeof block?.hasElevator === "boolean" ? block.hasElevator : null,
  };
}

function normalizeState(raw: Partial<QuoteWizardState>): QuoteWizardState {
  const base = createInitialQuoteState();
  return {
    ...base,
    ...raw,
    origin: normalizeAddress(raw.origin),
    destination: normalizeAddress(raw.destination),
    quantities: raw.quantities ?? {},
    contact: { ...base.contact, ...raw.contact },
  };
}

const STEPS = [
  "origin",
  "destination",
  "inventory",
  "fragile",
  "parkingOrigin",
  "parkingDestination",
  "contact",
  "summary",
] as const;

export function QuoteWizard({
  catalog,
  pricing,
}: {
  catalog: MovingCatalog;
  pricing: PricingConfig;
}) {
  const [state, setState] = useState<QuoteWizardState>(createInitialQuoteState);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showBoxesModal, setShowBoxesModal] = useState(false);
  const [done, setDone] = useState(false);

  const step = STEPS[stepIndex];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          state: QuoteWizardState;
          stepIndex: number;
        };
        if (parsed.state) setState(normalizeState(parsed.state));
        if (typeof parsed.stepIndex === "number") {
          setStepIndex(
            Math.min(Math.max(0, parsed.stepIndex), STEPS.length - 1),
          );
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, stepIndex }),
      );
    } catch {
      /* ignore */
    }
  }, [state, stepIndex, hydrated]);

  const canNext = useMemo(() => {
    switch (step) {
      case "origin":
        return isAddressValid(state.origin);
      case "destination":
        return isAddressValid(state.destination);
      case "inventory":
        return isInventoryValid(state.quantities, catalog);
      case "fragile":
        return isFragileValid(state.hasFragile);
      case "parkingOrigin":
        return isParkingValid(state.parkingOrigin);
      case "parkingDestination":
        return isParkingValid(state.parkingDestination);
      case "contact":
        return isContactValid(state.contact);
      case "summary":
        return true;
      default:
        return false;
    }
  }, [state, step, catalog]);

  const suggestedBoxes = useMemo(
    () => suggestBoxes(sumQuantities(state.quantities, catalog).totalM3, pricing),
    [state.quantities, catalog, pricing],
  );

  const setQuantity = useCallback((itemId: string, qty: number) => {
    setState((prev) => {
      const next = { ...prev.quantities };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = qty;
      return { ...prev, quantities: next };
    });
  }, []);

  const goNext = () => {
    if (step === "inventory" && !state.boxesPromptSeen) {
      setShowBoxesModal(true);
      return;
    }
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const acceptBoxes = () => {
    setState((prev) => ({
      ...prev,
      packingBoxes: suggestedBoxes,
      boxesPromptSeen: true,
    }));
    setShowBoxesModal(false);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const declineBoxes = () => {
    setState((prev) => ({ ...prev, boxesPromptSeen: true }));
    setShowBoxesModal(false);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse rounded-2xl bg-slate-100 p-10" />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
          <button
            type="button"
            className="underline hover:text-slate-800"
            onClick={() => {
              setState(createInitialQuoteState());
              setStepIndex(0);
              setDone(false);
              localStorage.removeItem(STORAGE_KEY);
            }}
          >
            Empezar de nuevo
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-ep3-navy transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {step === "origin" ? (
          <AddressStep
            title="¿Cuál es tu dirección de origen?"
            value={state.origin}
            onChange={(origin) => setState((s) => ({ ...s, origin }))}
          />
        ) : null}

        {step === "destination" ? (
          <AddressStep
            title="¿Y cuál es tu dirección de destino?"
            value={state.destination}
            onChange={(destination) =>
              setState((s) => ({ ...s, destination }))
            }
            showMapPlaceholder
          />
        ) : null}

        {step === "inventory" ? (
          <InventoryStep
            catalog={catalog}
            pricing={pricing}
            quantities={state.quantities}
            packingBoxes={state.packingBoxes}
            onQuantityChange={setQuantity}
          />
        ) : null}

        {step === "fragile" ? (
          <FragileStep
            value={state.hasFragile}
            notes={state.fragileNotes}
            onChange={(hasFragile, fragileNotes) =>
              setState((s) => ({ ...s, hasFragile, fragileNotes }))
            }
          />
        ) : null}

        {step === "parkingOrigin" ? (
          <ParkingStep
            title={
              <>
                Para descartar sorpresas, ¿en la dirección de{" "}
                <strong className="underline">inicio</strong>, el camión se
                puede estacionar cerca de la entrada?
              </>
            }
            value={state.parkingOrigin}
            onChange={(parkingOrigin) =>
              setState((s) => ({ ...s, parkingOrigin }))
            }
          />
        ) : null}

        {step === "parkingDestination" ? (
          <ParkingStep
            title={
              <>
                ¿Y en la dirección de{" "}
                <strong className="underline">destino</strong>, el camión se
                puede estacionar cerca de la entrada?
              </>
            }
            value={state.parkingDestination}
            onChange={(parkingDestination) =>
              setState((s) => ({ ...s, parkingDestination }))
            }
          />
        ) : null}

        {step === "contact" ? (
          <ContactStep
            value={state.contact}
            onChange={(contact) => setState((s) => ({ ...s, contact }))}
          />
        ) : null}

        {step === "summary" ? (
          <SummaryStep
            state={state}
            catalog={catalog}
            pricing={pricing}
            done={done}
            onDone={() => {
              setDone(true);
              localStorage.removeItem(STORAGE_KEY);
            }}
          />
        ) : null}

        {step !== "summary" || !done ? (
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            {step !== "summary" ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="rounded-lg bg-ep3-navy px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-40"
              >
                Siguiente
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showBoxesModal ? (
        <BoxesSuggestModal
          suggested={suggestedBoxes}
          onAccept={acceptBoxes}
          onDecline={declineBoxes}
        />
      ) : null}
    </div>
  );
}
