import { NextRequest, NextResponse } from "next/server";
import { semanticSearch, extractStructuredQuery, StructuredQuery } from "@/lib/ai";
import { normalizeResult, sortResults, NormalizedResult } from "@/lib/normalize";
import { searchGoogleShopping } from "@/lib/services/googleShopping";
import { searchAmazon } from "@/lib/services/amazon";
import { searchWalmart } from "@/lib/services/walmart";
import { searchEbay } from "@/lib/services/ebay";
import { rateLimit, getClientIp } from "@/lib/security";

function buildSearchKeyword(structured: StructuredQuery): string {
  const parts: string[] = [];
  if (structured.brand) parts.push(structured.brand);
  if (structured.model) parts.push(structured.model);
  if (structured.category) parts.push(structured.category);
  return parts.length > 0 ? parts.join(" ") : structured.original_query;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`ai-semantic:${ip}`, 10, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userQuery } = body;

    if (!userQuery) {
      return NextResponse.json({ error: "userQuery is required" }, { status: 400 });
    }

    // Extract structured query from natural language using Gemini (Phase 3.4)
    const structured = await extractStructuredQuery(userQuery);
    const searchKeyword = buildSearchKeyword(structured);
    console.log(`[Semantic] Original: "${userQuery}" → Structured:`, structured, `→ Keyword: "${searchKeyword}"`);

    // Fetch real products from SerpApi using the extracted keyword
    const apiKey = process.env.SERPAPI_KEY || "";
    let allProducts: NormalizedResult[] = [];

    if (apiKey) {
      const sourcePromises = [
        { name: "Google Shopping", fn: () => searchGoogleShopping(searchKeyword, apiKey) },
        { name: "Amazon", fn: () => searchAmazon(searchKeyword, apiKey) },
        { name: "Walmart", fn: () => searchWalmart(searchKeyword, apiKey) },
        { name: "eBay", fn: () => searchEbay(searchKeyword, apiKey) },
      ];

      const settled = await Promise.allSettled(
        sourcePromises.map(async (s) => {
          try {
            const raw = await s.fn();
            return raw.map((r) => normalizeResult(s.name, r));
          } catch {
            return [];
          }
        })
      );

      for (const result of settled) {
        if (result.status === "fulfilled") {
          allProducts.push(...result.value);
        }
      }
    }

    // Filter out zero-price and sort
    allProducts = sortResults(allProducts).filter((p) => p.price > 0);

    // Apply price filters from structured query
    if (structured.max_price) {
      allProducts = allProducts.filter((p) => p.price <= structured.max_price!);
    }
    if (structured.min_price) {
      allProducts = allProducts.filter((p) => p.price >= structured.min_price!);
    }

    // Limit to top 15 products for AI context
    const topProducts = allProducts.slice(0, 15);

    // Pass real products to AI for ranking
    const result = await semanticSearch(userQuery, topProducts);

    return NextResponse.json({ ...result, structured_query: structured });
  } catch (err) {
    console.error("[AI] semantic-search error:", err);
    return NextResponse.json({ error: "AI search failed. Please try again." }, { status: 500 });
  }
}
