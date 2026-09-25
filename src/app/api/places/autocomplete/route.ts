import { NextResponse } from "next/server";
import {
  searchChileAddresses,
  searchNominatim,
} from "@/lib/places/chile-address";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [], provider: "nominatim" });
  }

  const forceNominatim = searchParams.get("provider") === "nominatim";
  const result = forceNominatim
    ? await searchNominatim(q)
    : await searchChileAddresses(q);
  return NextResponse.json(result);
}
