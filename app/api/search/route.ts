import { NextRequest, NextResponse } from "next/server";
import { normalizeResult, sortResults, findCheapest, NormalizedResult } from "@/lib/normalize";
import { searchGoogleShopping } from "@/lib/services/googleShopping";
import { searchAmazon } from "@/lib/services/amazon";
import { searchWalmart } from "@/lib/services/walmart";
import { searchEbay } from "@/lib/services/ebay";
import { getCached, setCache, cacheKey } from "@/lib/cache";
import { saveSearch } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { filterResults } from "@/lib/relevance";
import { upsertProduct, insertPriceSnapshot } from "@/lib/db";

function getMockResults(query: string): NormalizedResult[] {
  const q = query.toLowerCase();
  if (q.includes("iphone")) {
    return [
      normalizeResult("eBay", { title: "Apple iPhone 15 Pro 128GB - Unlocked", price: 79716, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 940 }),
      normalizeResult("Walmart", { title: "Apple iPhone 15 Pro 128GB (Unlocked)", price: 81312, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3420 }),
      normalizeResult("Google Shopping", { title: "Apple iPhone 15 Pro 128GB - Best Buy", price: 83999, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 2100 }),
      normalizeResult("Amazon", { title: "Apple iPhone 15 Pro 128GB - Prime", price: 86436, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 12890 }),
    ];
  }
  if (q.includes("sony") || q.includes("wh-1000")) {
    return [
      normalizeResult("Walmart", { title: "Sony WH-1000XM5 Wireless Noise Canceling", price: 27552, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3420, originalPrice: 33599 }),
      normalizeResult("Amazon", { title: "Sony WH-1000XM5 - Prime Available", price: 29232, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 12890, originalPrice: 33599 }),
      normalizeResult("Google Shopping", { title: "Sony WH-1000XM5 - Best Buy", price: 29399, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 2100 }),
      normalizeResult("eBay", { title: "Sony WH-1000XM5 - Top Rated Plus", price: 29816, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 940 }),
    ];
  }
  if (q.includes("macbook")) {
    return [
      normalizeResult("Amazon", { title: 'MacBook Air M3 13" (8GB/256GB)', price: 83916, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 5420 }),
      normalizeResult("Walmart", { title: 'MacBook Air M3 13" 8GB/256GB', price: 85596, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 1200 }),
      normalizeResult("Google Shopping", { title: "MacBook Air M3 - Apple Store", price: 88116, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 890 }),
      normalizeResult("eBay", { title: "MacBook Air M3 2024 - New Sealed", price: 90636, currency: "INR", image: "", link: "#", rating: 4.6, reviews: 320 }),
    ];
  }
  if (q.includes("playstation") || q.includes("ps5")) {
    return [
      normalizeResult("Walmart", { title: "PlayStation 5 Slim Console - Disc", price: 37799, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 8720 }),
      normalizeResult("Amazon", { title: "PlayStation 5 Slim Disc Console", price: 39479, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 15300 }),
      normalizeResult("eBay", { title: "PS5 Slim Disc Edition - New Sealed", price: 40236, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 2100 }),
      normalizeResult("Google Shopping", { title: "PlayStation 5 Slim - Best Buy", price: 41159, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3400 }),
    ];
  }
  return [
    normalizeResult("eBay", { title: `${query} - Top Rated Seller`, price: 16799, currency: "INR", image: "", link: "#", rating: 4.5, reviews: 320 }),
    normalizeResult("Walmart", { title: `${query} - Free 2-Day Delivery`, price: 18479, currency: "INR", image: "", link: "#", rating: 4.4, reviews: 1200 }),
    normalizeResult("Google Shopping", { title: `${query} - Verified Retailer`, price: 19319, currency: "INR", image: "", link: "#", rating: 4.6, reviews: 890 }),
    normalizeResult("Amazon", { title: `${query} - Prime Available`, price: 20159, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 5400 }),
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query parameter is required" }, { status: 400 });
  }

  const trimmedQuery = query.trim();
  const authUser = authenticateRequest(request);

  // 1. Check Redis cache first
  const cacheKeyValue = cacheKey("search", trimmedQuery);
  const cached = await getCached<{
    query: string;
    results: NormalizedResult[];
    cheapest: { source: string; price: number } | null;
    fetchedAt: string;
    fromCache: boolean;
  }>(cacheKeyValue);

  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  // 2. Cache miss — fetch from sources
  const apiKey = process.env.SERPAPI_KEY;
  const useLiveApi = apiKey && apiKey.length > 0;

  let allResults: NormalizedResult[] = [];

  if (useLiveApi) {
    const sourcePromises = [
      { name: "Google Shopping", fn: () => searchGoogleShopping(trimmedQuery, apiKey) },
      { name: "Amazon", fn: () => searchAmazon(trimmedQuery, apiKey) },
      { name: "Walmart", fn: () => searchWalmart(trimmedQuery, apiKey) },
      { name: "eBay", fn: () => searchEbay(trimmedQuery, apiKey) },
    ];

    const settled = await Promise.allSettled(
      sourcePromises.map(async (s) => {
        try {
          const raw = await s.fn();
          return raw.map((r) => normalizeResult(s.name, r));
        } catch (err) {
          console.error(`[${s.name}] failed:`, err);
          return [];
        }
      })
    );

for (const result of settled) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }
  } else {
    allResults = getMockResults(trimmedQuery);
  }

  // Filter results for relevance (Phase 1)
  allResults = await filterResults(trimmedQuery, allResults);

  const sorted = sortResults(allResults);
  const cheapest = findCheapest(sorted);

  // Record price snapshots for live results (Phase 2) and attach productId to results
  const resultsWithProductId = sorted.map((result) => {
    let productId: number | undefined;
    if (useLiveApi && result.link && result.link !== "#") {
      try {
        productId = upsertProduct(result.title, result.source, result.link, result.image);
        insertPriceSnapshot(productId, result.price, result.currency);
      } catch (err) {
        console.error("[PriceHistory] snapshot error:", err);
      }
    }
    return { ...result, productId };
  });

  const response = {
    query: trimmedQuery,
    results: resultsWithProductId,
    cheapest,
    fetchedAt: new Date().toISOString(),
  };

  // 3. Save to cache (20 min TTL)
  await setCache(cacheKeyValue, response);

  // 4. Save to SQLite (search history) — attribute to the user when signed in
  try {
    saveSearch(trimmedQuery, sorted, sorted.length, authUser?.id);
  } catch {
    // Non-critical — don't fail the request
  }

  return NextResponse.json(response);
}
