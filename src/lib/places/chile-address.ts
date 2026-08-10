export type AddressSuggestion = {
  id: string;
  label: string;
  lat?: number;
  lon?: number;
};

export type AddressSearchResult = {
  suggestions: AddressSuggestion[];
  provider: "nominatim" | "google";
  error?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Chile address search via OpenStreetMap Nominatim.
 * Free; rate-limit ~1 req/s — call from a server route with debounce on the client.
 */
export async function searchChileAddresses(
  query: string,
): Promise<AddressSearchResult> {
  const q = query.trim();
  if (q.length < 3) {
    return { suggestions: [], provider: "nominatim" };
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (googleKey) {
    const google = await tryGooglePlaces(q, googleKey);
    if (google) return google;
  }

  return searchNominatim(q);
}

async function searchNominatim(query: string): Promise<AddressSearchResult> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "cl");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "TransportesEP3Cotizar/1.0 (cotizar@transportesep3.cl)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return {
      suggestions: [],
      provider: "nominatim",
      error: "No se pudo buscar direcciones ahora. Intenta de nuevo.",
    };
  }

  const data = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return {
    provider: "nominatim",
    suggestions: data.map((row) => ({
      id: String(row.place_id),
      label: row.display_name,
      lat: Number(row.lat),
      lon: Number(row.lon),
    })),
  };
}

async function tryGooglePlaces(
  query: string,
  apiKey: string,
): Promise<AddressSearchResult | null> {
  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", query);
    url.searchParams.set("components", "country:cl");
    url.searchParams.set("language", "es");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      status: string;
      predictions?: Array<{ place_id: string; description: string }>;
      error_message?: string;
    };

    if (data.status === "OK" && data.predictions?.length) {
      return {
        provider: "google",
        suggestions: data.predictions.map((p) => ({
          id: p.place_id,
          label: p.description,
        })),
      };
    }

    // REQUEST_DENIED / BILLING_NOT_ENABLED → fall through to Nominatim
    return null;
  } catch {
    return null;
  }
}
