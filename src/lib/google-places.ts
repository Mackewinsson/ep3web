const PLACE_QUERY = "Transportes EP3 Phillips Santiago Chile";
const REVALIDATE_SECONDS = 86400; // 24 hours

export interface Review {
  author: string;
  authorPhotoUrl: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface PlaceData {
  name: string;
  rating: number;
  totalReviews: number;
  reviews: Review[];
  mapsUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(r: any): Review {
  return {
    author: r.authorAttribution?.displayName ?? "Cliente",
    authorPhotoUrl: r.authorAttribution?.photoUri ?? "",
    rating: r.rating ?? 5,
    text: r.originalText?.text ?? r.text?.text ?? "",
    relativeTime: r.relativePublishTimeDescription ?? "",
  };
}

export async function fetchPlaceData(): Promise<PlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[google-places] GOOGLE_PLACES_API_KEY not set — skipping reviews fetch.");
    return null;
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: PLACE_QUERY,
        maxResultCount: 1,
        languageCode: "es",
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error("[google-places] API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    return {
      name: place.displayName?.text ?? "Transportes EP3",
      rating: place.rating ?? 0,
      totalReviews: place.userRatingCount ?? 0,
      reviews: (place.reviews ?? []).map(mapReview),
      mapsUrl:
        place.googleMapsUri ??
        "https://www.google.com/maps/place/Transportes+Ep3+-+P.%C2%BA+Phillips,+8320138+Santiago",
    };
  } catch (err) {
    console.error("[google-places] Fetch failed:", err);
    return null;
  }
}
