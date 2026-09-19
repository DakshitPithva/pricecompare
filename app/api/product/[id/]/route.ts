import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPriceHistory } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`product-detail:${ip}`, 30, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const params = await context.params;
    const productId = parseInt(params.id, 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const db = getDb();
    const product = db.prepare(`
      SELECT * FROM products WHERE id = ?
    `).get(productId) as {
      id: number;
      title: string;
      source: string;
      external_url: string | null;
      category: string | null;
      image_url: string | null;
      condition: string | null;
      created_at: string;
    } | undefined;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get all snapshots for price history
    const snapshots = getPriceHistory(productId, 90);

    // Calculate stats
    const prices = snapshots.map((s) => s.price).filter((p) => p > 0);
    const sorted = [...prices].sort((a, b) => a - b);
    const currentPrice = prices.length > 0 ? prices[prices.length - 1] : null;
    const lowestEver = sorted[0] ?? null;
    const highestEver = sorted[sorted.length - 1] ?? null;
    const avg30d = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    const dealScore = avg30d && currentPrice ? ((avg30d - currentPrice) / avg30d) * 100 : null;

    // Estimate MRP (highest price seen + buffer, or originalPrice from search)
    const mrp = highestEver ? Math.round(highestEver * 1.1) : null;

    // Get other listings of same product title from other sources
    const otherListings = db.prepare(`
      SELECT source, title, image_url, external_url, condition, created_at
      FROM products
      WHERE LOWER(title) = LOWER(?) AND id != ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(product.title, productId) as {
      source: string;
      title: string;
      image_url: string | null;
      external_url: string | null;
      condition: string | null;
      created_at: string;
    }[];

    // Build offers from other listings
    const offers = otherListings.map((l) => ({
      source: l.source,
      title: l.title,
      image: l.image_url,
      link: l.external_url,
      condition: l.condition || "New",
    }));

    // Detect condition from title if not stored
    const detectCondition = (title: string, apiCondition?: string | null): string => {
      if (apiCondition) {
        const c = apiCondition.toLowerCase();
        if (c.includes("refurb")) return "Refurbished";
        if (c.includes("used")) return "Used";
        if (c.includes("open box")) return "Open Box";
        if (c.includes("new")) return "New";
      }
      const t = title.toLowerCase();
      if (t.includes("refurb") || t.includes("renewed") || t.includes("restored") || t.includes("certified pre")) return "Refurbished";
      if (t.includes("open box")) return "Open Box";
      if (t.includes("used") || t.includes("second hand") || t.includes("pre owned")) return "Used";
      return "New";
    };

    const condition = detectCondition(product.title, product.condition);

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        source: product.source,
        externalUrl: product.external_url,
        category: product.category,
        image: product.image_url,
        condition,
        currentPrice,
        mrp,
        discount: mrp && currentPrice ? Math.round(((mrp - currentPrice) / mrp) * 100) : null,
        rating: 4.5, // Would come from reviews API in production
        reviewCount: 1000,
        priceHistory: snapshots.map((s) => ({
          date: s.checked_at,
          price: s.price,
        })),
        stats: {
          currentPrice,
          lowestEver,
          highestEver,
          avg30d: avg30d ? Math.round(avg30d) : null,
          dealScore: dealScore ? Math.round(dealScore * 10) / 10 : null,
          dataPoints: prices.length,
        },
        offers,
        deliveryEstimate: "2-4 business days",
        inStock: true,
      },
    });
  } catch (err) {
    console.error("[ProductDetail] error:", err);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}