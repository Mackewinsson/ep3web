"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  pinFromSuggestions,
  type AddressSuggestion,
} from "@/lib/places/chile-address";

async function fetchSuggestions(query: string, nominatimOnly = false) {
  const provider = nominatimOnly ? "&provider=nominatim" : "";
  const res = await fetch(
    `/api/places/autocomplete?q=${encodeURIComponent(query)}${provider}`,
  );
  return (await res.json()) as {
    suggestions: AddressSuggestion[];
    provider?: string;
    error?: string;
  };
}

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-ep3-navy md:text-sm";

type Props = {
  value: string;
  onChange: (address: string) => void;
  /** Fired when the user picks a suggestion, including its coordinates. */
  onSelect?: (suggestion: AddressSuggestion) => void;
  /** First result that can be drawn, or null when the query has no pin. */
  onPin?: (pin: { lat: number; lon: number } | null) => void;
  placeholder?: string;
};

export function ChileAddressAutocomplete({
  value,
  onChange,
  onSelect,
  onPin,
  placeholder = "Calle, número, comuna…",
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSearch = useRef(false);
  const requestId = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setError(null);
      onPinRef.current?.(null);
      return;
    }

    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSuggestions(q);
        if (id !== requestId.current) return;
        let suggestions = data.suggestions ?? [];
        let pin = pinFromSuggestions(suggestions);
        if (!pin && data.provider !== "nominatim") {
          const fallback = await fetchSuggestions(q, true);
          if (id !== requestId.current) return;
          pin = pinFromSuggestions(fallback.suggestions ?? []);
        }
        setSuggestions(suggestions);
        setOpen(true);
        onPinRef.current?.(pin);
        if (data.error) setError(data.error);
      } catch {
        if (id !== requestId.current) return;
        setError("No se pudo buscar direcciones.");
        setSuggestions([]);
        onPinRef.current?.(null);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(s: AddressSuggestion) {
    skipSearch.current = true;
    requestId.current += 1;
    setQuery(s.label);
    setSuggestions([]);
    setOpen(false);
    const pin = pinFromSuggestions([s]);
    if (pin) onPinRef.current?.(pin);
    if (onSelect) onSelect(s);
    else onChange(s.label);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={fieldClass}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {loading ? (
        <p className="mt-1 text-xs text-slate-400">Buscando en Chile…</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={s.id} role="option">
              <button
                type="button"
          className="w-full px-3 py-3 text-left text-sm leading-snug text-slate-800 hover:bg-slate-50 active:bg-slate-50"
                onClick={() => pick(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
