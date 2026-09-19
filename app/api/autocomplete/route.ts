import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`autocomplete:${ip}`, 30, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const db = getDb();
    const trimmedQuery = query.trim().toLowerCase();

    // Get suggestions from:
    // 1. Recent searches by users (most popular)
    // 2. Product titles from our products table
    // 3. Search queries from search history

    const searchSuggestions = db.prepare(`
      SELECT query as suggestion, COUNT(*) as count
      FROM searches
      WHERE LOWER(query) LIKE ?
      GROUP BY query
      ORDER BY count DESC
      LIMIT ?
    `).all(`${trimmedQuery}%`, Math.ceil(limit / 2)) as { suggestion: string; count: number }[];

    const productSuggestions = db.prepare(`
      SELECT title as suggestion, 1 as count
      FROM products
      WHERE LOWER(title) LIKE ?
      LIMIT ?
    `).all(`${trimmedQuery}%`, Math.ceil(limit / 2)) as { suggestion: string; count: number }[];

    // Combine and deduplicate
    const allSuggestions = [...searchSuggestions, ...productSuggestions];
    const seen = new Set<string>();
    const uniqueSuggestions = allSuggestions
      .filter((s) => {
        if (seen.has(s.suggestion.toLowerCase())) return false;
        seen.add(s.suggestion.toLowerCase());
        return true;
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((s) => s.suggestion);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (err) {
    console.error("[Autocomplete] error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}