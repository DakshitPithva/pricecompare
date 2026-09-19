import { NextResponse } from "next/server";
import { getRecentSearches } from "@/lib/db";

export async function GET() {
  try {
    const searches = getRecentSearches(20);
    return NextResponse.json({ searches });
  } catch {
    return NextResponse.json({ searches: [] });
  }
}
