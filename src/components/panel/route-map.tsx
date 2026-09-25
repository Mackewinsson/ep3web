"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { DrivingRoute } from "@/lib/places/driving-route";
import "leaflet/dist/leaflet.css";

type Props = { route: DrivingRoute };

/** Origin, the drive, and the destination. Tiles are public OpenStreetMap. */
export function RouteMap({ route }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let cancelled = false;

    void import("leaflet").then((leaflet) => {
      if (cancelled || mapRef.current) return;
      const L = leaflet.default ?? leaflet;
      const map = L.map(el, { scrollWheelZoom: false }).setView(
        [route.origin.lat, route.origin.lon],
        12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.polyline(route.line, { color: "#0b1f3a", weight: 5, opacity: 0.9 }).addTo(
        map,
      );
      L.circleMarker([route.origin.lat, route.origin.lon], {
        radius: 8,
        color: "#0b1f3a",
        weight: 2,
        fillColor: "#f5c518",
        fillOpacity: 1,
      })
        .bindTooltip("Origen", { permanent: true, direction: "top", offset: [0, -8] })
        .addTo(map);
      L.circleMarker([route.destination.lat, route.destination.lon], {
        radius: 8,
        color: "#f5c518",
        weight: 2,
        fillColor: "#0b1f3a",
        fillOpacity: 1,
      })
        .bindTooltip("Destino", { permanent: true, direction: "top", offset: [0, -8] })
        .addTo(map);

      map.fitBounds(L.latLngBounds(route.line), { padding: [28, 28] });
      mapRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [route]);

  return (
    <div className="overflow-hidden rounded-lg border border-ep3-navy/15 bg-white">
      <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-ep3-navy/55">
        Recorrido
      </p>
      <div ref={elRef} className="mt-2 h-56 w-full sm:h-64" />
    </div>
  );
}
