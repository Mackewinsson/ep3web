"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/places/chile-address";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-ep3-navy md:text-sm";

type Props = {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
};

export function ChileAddressAutocomplete({
  value,
  onChange,
  placeholder = "Calle, número, comuna…",
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSearch = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(q)}`,
        );
        const data = (await res.json()) as {
          suggestions: AddressSuggestion[];
          error?: string;
        };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
        if (data.error) setError(data.error);
      } catch {
        setError("No se pudo buscar direcciones.");
        setSuggestions([]);
      } finally {
        setLoading(false);
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
    setQuery(s.label);
    onChange(s.label);
    setSuggestions([]);
    setOpen(false);
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
