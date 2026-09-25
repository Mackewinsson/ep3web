"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

const SANTIAGO = { lat: -33.4489, lon: -70.6693 };
const CITY_ZOOM = 11;
const PIN_ZOOM = 16;

type Props = {
  lat: number | null;
  lon: number | null;
};

/**
 * Read-only OpenStreetMap view. Tiles are public; no API key.
 * Leaflet touches `window`, so it is loaded only after mount.
 */
export function AddressMap({ lat, lon }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const coordsRef = useRef({ lat, lon });
  coordsRef.current = { lat, lon };

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let cancelled = false;

    void import("leaflet").then((leaflet) => {
      if (cancelled || mapRef.current) return;
      const L = leaflet.default ?? leaflet;
      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([SANTIAGO.lat, SANTIAGO.lon], CITY_ZOOM);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;
      placePin(L, map);
      requestAnimationFrame(() => map.invalidateSize());
    });

    function placePin(L: typeof import("leaflet"), map: LeafletMap) {
      const { lat: pinLat, lon: pinLon } = coordsRef.current;
      markerRef.current?.remove();
      markerRef.current = null;
      if (pinLat == null || pinLon == null) {
        map.setView([SANTIAGO.lat, SANTIAGO.lon], CITY_ZOOM);
        return;
      }
      markerRef.current = L.circleMarker([pinLat, pinLon], {
        radius: 9,
        color: "#0b1f3a",
        weight: 2,
        fillColor: "#f5c518",
        fillOpacity: 1,
      }).addTo(map);
      map.setView([pinLat, pinLon], PIN_ZOOM);
    }

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void import("leaflet").then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      markerRef.current?.remove();
      markerRef.current = null;
      if (lat == null || lon == null) {
        map.setView([SANTIAGO.lat, SANTIAGO.lon], CITY_ZOOM);
        return;
      }
      markerRef.current = L.circleMarker([lat, lon], {
        radius: 9,
        color: "#0b1f3a",
        weight: 2,
        fillColor: "#f5c518",
        fillOpacity: 1,
      }).addTo(map);
      map.setView([lat, lon], PIN_ZOOM);
    });
  }, [lat, lon]);

  const located = lat != null && lon != null;

  return (
    <div className="relative h-36 overflow-hidden rounded-xl border border-slate-300 sm:h-44">
      <div ref={elRef} className="h-full w-full" />
      {located ? null : (
        <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-slate-600">
          Escribe la dirección para verla en el mapa
        </p>
      )}
    </div>
  );
}
