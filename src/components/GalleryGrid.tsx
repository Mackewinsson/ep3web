"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";
import theme from "@/theme.json";

const { navy, yellow, kraft } = theme.colors;

const SIZE_CLASSES: Record<GalleryItem["size"], string> = {
  large:
    "col-span-12 row-span-2 min-h-[260px] sm:col-span-7 sm:min-h-[340px] lg:min-h-[380px]",
  medium: "col-span-12 min-h-[220px] sm:col-span-5 sm:min-h-[240px]",
  small: "col-span-12 min-h-[200px] sm:col-span-4 sm:min-h-[220px]",
};

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:text-[11px]"
      style={{ background: yellow, color: navy }}
    >
      {label}
    </span>
  );
}

function GalleryTile({
  item,
  index,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  onOpen: (item: GalleryItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`gallery-tile group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${SIZE_CLASSES[item.size]}`}
      style={{
        animationDelay: `${index * 80}ms`,
        outlineColor: yellow,
      }}
      aria-label={`Ver foto: ${item.alt}`}
    >
      <div className="absolute inset-0">
        <Image
          src={item.src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          aria-hidden
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(to top, ${navy}e6 0%, ${navy}66 45%, transparent 100%)`,
        }}
        aria-hidden
      />

      <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
        <CategoryBadge label={item.category} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-3 p-3 sm:p-4">
        <p className="max-w-[85%] text-sm font-semibold leading-snug text-white drop-shadow-sm sm:text-base">
          {item.caption.split("—")[0].trim()}
        </p>
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"
          style={{ background: yellow, color: navy }}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z" />
          </svg>
        </span>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-4 right-4 h-0.5 scale-x-0 rounded-full transition duration-300 group-hover:scale-x-100"
        style={{ background: yellow }}
        aria-hidden
      />
    </button>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar galería"
      />

      <div className="gallery-lightbox-enter relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/10]">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0 flex-1">
            <CategoryBadge label={item.category} />
            <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">
              {item.caption}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition hover:brightness-110"
            style={{ background: navy, color: "white" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close]);

  return (
    <>
      <div className="gallery-grid grid auto-rows-fr grid-cols-12 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <GalleryTile key={item.id} item={item} index={i} onOpen={setActive} />
        ))}
      </div>

      {active && <Lightbox item={active} onClose={close} />}
    </>
  );
}
