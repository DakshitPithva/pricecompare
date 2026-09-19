import { NextRequest, NextResponse } from "next/server";
import { predictBuyOrWait } from "@/lib/ai";
import { rateLimit, getClientIp } from "@/lib/security";
import { getPriceHistoryForQuery } from "@/lib/db";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`ai-buyorwait:${ip}`, 10, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { productName, currentPrice, source } = body;

    if (!productName || !currentPrice) {
      return NextResponse.json({ error: "productName and currentPrice are required" }, { status: 400 });
    }

    // Fetch real price history from DB (Phase 3 grounding)
    const historyData = getPriceHistoryForQuery(productName, 30);
    let priceHistory: { price: number; date: string }[] = [];
    if (historyData.length > 0) {
      // Use the product with the most snapshots
      const bestMatch = historyData.reduce((a, b) => b.snapshots.length > a.snapshots.length ? b : a);
      priceHistory = bestMatch.snapshots.map((s) => ({ price: s.price, date: s.checked_at }));
    }

    const result = await predictBuyOrWait(productName, currentPrice, source || "Unknown", priceHistory);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI] buy-or-wait error:", err);
    return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 500 });
  }
}
