import { NextRequest, NextResponse } from "next/server";
import { getPriceHistoryForQuery, getPriceHistory } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`price-history:${ip}`, 30, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const productId = searchParams.get("productId");
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (!query && !productId) {
      return NextResponse.json({ error: "query or productId parameter is required" }, { status: 400 });
    }

    let historyData: { product: { id: number; title: string; source: string; external_url: string | null; image_url: string | null; category: string | null }; snapshots: { price: number; currency: string; checked_at: string }[] }[] = [];

    if (productId) {
      const pid = parseInt(productId, 10);
      const snapshots = getPriceHistory(pid, days);
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(pid) as { id: number; title: string; source: string; external_url: string | null; image_url: string | null; category: string | null; created_at: string } | undefined;
      if (prod) {
        historyData = [{ product: prod, snapshots }];
      }
    } else if (query) {
      historyData = getPriceHistoryForQuery(query, days);
    }

    // Calculate deal scores and aggregate stats
    const results = historyData.map((item) => {
      const prices = item.snapshots.map((s) => s.price).filter((p) => p > 0);
      if (prices.length === 0) {
        return {
          product: item.product,
          snapshots: item.snapshots,
          stats: null,
          dealScore: null,
          lowestEver: null,
          highestEver: null,
          avg30d: null,
          currentPrice: null,
          dataPoints: 0,
        };
      }

      const sorted = [...prices].sort((a, b) => a - b);
      const currentPrice = prices[prices.length - 1];
      const lowestEver = sorted[0];
      const highestEver = sorted[sorted.length - 1];
      const avg30d = prices.reduce((a, b) => a + b, 0) / prices.length;
      const dealScore = ((avg30d - currentPrice) / avg30d) * 100;

      return {
        product: item.product,
        snapshots: item.snapshots,
        stats: {
          currentPrice,
          lowestEver,
          highestEver,
          avg30d: Math.round(avg30d),
          dealScore: Math.round(dealScore * 10) / 10,
          dataPoints: prices.length,
        },
        dealScore: Math.round(dealScore * 10) / 10,
        lowestEver,
        highestEver,
        avg30d: Math.round(avg30d),
        currentPrice,
        dataPoints: prices.length,
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[PriceHistory] error:", err);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}