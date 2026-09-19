import { NextRequest, NextResponse } from "next/server";
import { summarizeReviews } from "@/lib/ai";
import { rateLimit, getClientIp } from "@/lib/security";
import { fetchReviewsForProduct } from "@/lib/services/reviews";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`ai-review:${ip}`, 10, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { productName, product } = body;

    if (!productName) {
      return NextResponse.json({ error: "productName is required" }, { status: 400 });
    }

    // Fetch real reviews from SerpApi if product info provided
    let reviews: { text: string; rating: number; source: string }[] = [];
    const apiKey = process.env.SERPAPI_KEY;
    
    if (product && apiKey) {
      const fetched = await fetchReviewsForProduct(product, apiKey);
      reviews = fetched.map((r) => ({ text: r.text, rating: r.rating, source: r.source }));
    }

    const result = await summarizeReviews(productName, reviews);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI] review-summary error:", err);
    return NextResponse.json({ error: "AI summarization failed. Please try again." }, { status: 500 });
  }
}
