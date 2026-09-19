import { NextRequest, NextResponse } from "next/server";
import { compareProducts } from "@/lib/ai";
import { authenticateRequest } from "@/lib/auth";
import { saveComparison } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`ai-compare:${ip}`, 10, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { query, products } = body;

    if (!products || products.length < 2) {
      return NextResponse.json({ error: "At least 2 products are required" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    const result = await compareProducts(products, apiKey);

    // Save to comparison history if user is logged in
    const authUser = authenticateRequest(request);
    if (authUser) {
      try {
        saveComparison(authUser.id, query || "Product Comparison", products, result.verdict, result.winner);
      } catch (e) {
        console.error("[AI] save comparison error:", e);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI] compare error:", err);
    return NextResponse.json({ error: "AI comparison failed. Please try again." }, { status: 500 });
  }
}
