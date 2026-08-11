"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ThankYouStep } from "@/components/cotizar/steps/ThankYouStep";
import { type MovingCatalog } from "@/lib/moving-catalog";
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
    customItems: Array.isArray(raw.customItems)
      ? raw.customItems.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.quantity === "number" &&
            item.quantity > 0,
        )
      : [],
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
  "thanks",
] as const;

export function QuoteWizard({
  catalog,
  pricing: _pricing,
}: {
  catalog: MovingCatalog;
  pricing: PricingConfig;
}) {
  const [state, setState] = useState<QuoteWizardState>(createInitialQuoteState);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
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
        return isInventoryValid(
          state.quantities,
          catalog,
          state.customItems,
        );
      case "fragile":
        return isFragileValid(state.hasFragile);
      case "parkingOrigin":
        return isParkingValid(state.parkingOrigin);
      case "parkingDestination":
        return isParkingValid(state.parkingDestination);
      case "contact":
        return isContactValid(state.contact);
      case "thanks":
        return true;
      default:
        return false;
    }
  }, [state, step, catalog]);

  const setQuantity = useCallback((itemId: string, qty: number) => {
    setState((prev) => {
      const next = { ...prev.quantities };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = qty;
      return { ...prev, quantities: next };
    });
  }, []);

  const addCustomItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setState((prev) => {
      const existing = prev.customItems.find(
        (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing) {
        return {
          ...prev,
          customItems: prev.customItems.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        ...prev,
        customItems: [
          ...prev.customItems,
          {
            id: `custom-${crypto.randomUUID()}`,
            name: trimmed,
            quantity: 1,
          },
        ],
      };
    });
  }, []);

  const setCustomQuantity = useCallback((id: string, qty: number) => {
    setState((prev) => ({
      ...prev,
      customItems:
        qty <= 0
          ? prev.customItems.filter((item) => item.id !== id)
          : prev.customItems.map((item) =>
              item.id === id ? { ...item, quantity: qty } : item,
            ),
    }));
  }, []);

  const removeCustomItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customItems: prev.customItems.filter((item) => item.id !== id),
    }));
  }, []);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const progress =
    step === "thanks"
      ? 100
      : ((stepIndex + 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <div className="mb-4 sm:mb-6">
        {step !== "thanks" || !done ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="shrink-0 tabular-nums">
                {step === "thanks"
                  ? "Listo"
                  : `Paso ${stepIndex + 1} de ${STEPS.length - 1}`}
              </span>
              <button
                type="button"
                className="min-h-9 shrink truncate underline underline-offset-2 hover:text-slate-800"
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
            {step !== "thanks" ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-ep3-navy transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        {!hydrated ? (
          <div className="space-y-4" aria-hidden>
            <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-11 animate-pulse rounded-md bg-slate-100" />
          </div>
        ) : (
          <>
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
                quantities={state.quantities}
                customItems={state.customItems}
                onQuantityChange={setQuantity}
                onAddCustomItem={addCustomItem}
                onCustomQuantityChange={setCustomQuantity}
                onRemoveCustomItem={removeCustomItem}
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

            {step === "thanks" ? (
              <ThankYouStep
                state={state}
                onDone={() => {
                  setDone(true);
                  localStorage.removeItem(STORAGE_KEY);
                }}
              />
            ) : null}
          </>
        )}
      </div>

      {hydrated && step !== "thanks" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)] sm:pb-0">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="min-h-11 min-w-[6.5rem] rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className="min-h-11 flex-1 rounded-lg bg-ep3-navy px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-40 sm:flex-none"
            >
              {step === "contact" ? "Enviar solicitud" : "Siguiente"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
