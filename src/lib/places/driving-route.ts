import { pinFromSuggestions, searchNominatim } from "@/lib/places/chile-address";

export type LatLon = { lat: number; lon: number };

export type DrivingRoute = {
  origin: LatLon;
  destination: LatLon;
  /** [lat, lon] pairs along the drive. A straight segment if routing fails. */
  line: [number, number][];
};

const cache = new Map<string, DrivingRoute>();

/**
 * Drive from one Chilean address to another using OpenStreetMap.
 * Nominatim locates each address; the public OSRM server draws the road path.
 * No API key. Successful results are kept in memory for this server process.
 */
export async function drivingRoute(
  originAddress: string,
  destinationAddress: string,
): Promise<DrivingRoute | null> {
  const key = `${originAddress}\n${destinationAddress}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const originHit = await searchNominatim(originAddress);
  const destinationHit = await searchNominatim(destinationAddress);
  const origin = pinFromSuggestions(originHit.suggestions);
  const destination = pinFromSuggestions(destinationHit.suggestions);
  if (!origin || !destination) return null;

  const straight: [number, number][] = [
    [origin.lat, origin.lon],
    [destination.lat, destination.lon],
  ];
  let line = straight;

  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      `${origin.lon},${origin.lat};${destination.lon},${destination.lat}` +
      "?overview=full&geometries=geojson";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TransportesEP3Cotizar/1.0 (cotizar@transportesep3.cl)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 * 60 * 24 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        routes?: Array<{
          geometry?: { coordinates?: Array<[number, number]> };
        }>;
      };
      const coordinates = data.routes?.[0]?.geometry?.coordinates;
      if (coordinates && coordinates.length > 1) {
        line = coordinates.map(([lon, lat]) => [lat, lon]);
      }
    }
  } catch {
    line = straight;
  }

  const route = { origin, destination, line };
  cache.set(key, route);
  return route;
}
