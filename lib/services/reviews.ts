import { RawSourceResult } from "../normalize";

export interface ReviewSnippet {
  text: string;
  rating: number;
  source: string;
  author?: string;
  date?: string;
}

/** Fetch reviews for an Amazon product using SerpApi Amazon Reviews API */
export async function fetchAmazonReviews(productUrl: string, apiKey: string, maxReviews: number = 20): Promise<ReviewSnippet[]> {
  try {
    // Extract ASIN from Amazon URL
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/i) || productUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : null;
    if (!asin) return [];

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "amazon_reviews");
    url.searchParams.set("asin", asin);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("sort_by", "recent");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const reviews = data.reviews || [];

    return reviews.slice(0, maxReviews).map((r: Record<string, unknown>): ReviewSnippet => ({
      text: String(r.body || r.text || ""),
      rating: Number(r.rating || 0),
      source: "Amazon",
      author: String(r.author || ""),
      date: String(r.date || ""),
    })).filter((r: ReviewSnippet) => r.text.length > 10);
  } catch {
    return [];
  }
}

/** Fetch reviews for a Google Shopping product using SerpApi Product Reviews API */
export async function fetchGoogleShoppingReviews(productUrl: string, apiKey: string, maxReviews: number = 20): Promise<ReviewSnippet[]> {
  try {
    // Google Shopping product API URL is already in the search results as serpapi_product_api
    const url = new URL(productUrl);
    url.searchParams.set("api_key", apiKey);
    // Add reviews parameter if supported
    url.searchParams.set("reviews", "true");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const reviews = data.reviews || data.product_reviews || [];

    return reviews.slice(0, maxReviews).map((r: Record<string, unknown>): ReviewSnippet => ({
      text: String(r.snippet || r.text || r.body || ""),
      rating: Number(r.rating || 0),
      source: "Google Shopping",
      author: String(r.author || ""),
      date: String(r.date || ""),
    })).filter((r: ReviewSnippet) => r.text.length > 10);
  } catch {
    return [];
  }
}

/** Fetch reviews for a Walmart product */
export async function fetchWalmartReviews(productUrl: string, apiKey: string, maxReviews: number = 20): Promise<ReviewSnippet[]> {
  try {
    // Extract product ID from Walmart URL
    const idMatch = productUrl.match(/\/ip\/[^/]+\/(\d+)/i);
    const productId = idMatch ? idMatch[1] : null;
    if (!productId) return [];

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "walmart_reviews");
    url.searchParams.set("product_id", productId);
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const reviews = data.reviews || [];

    return reviews.slice(0, maxReviews).map((r: Record<string, unknown>): ReviewSnippet => ({
      text: String(r.review_text || r.text || r.body || ""),
      rating: Number(r.rating || 0),
      source: "Walmart",
      author: String(r.reviewer_name || r.author || ""),
      date: String(r.review_date || r.date || ""),
    })).filter((r: ReviewSnippet) => r.text.length > 10);
  } catch {
    return [];
  }
}

/** Fetch reviews for an eBay product */
export async function fetchEbayReviews(productUrl: string, apiKey: string, maxReviews: number = 20): Promise<ReviewSnippet[]> {
  try {
    // Extract item ID from eBay URL
    const idMatch = productUrl.match(/\/itm\/(\d+)/i);
    const itemId = idMatch ? idMatch[1] : null;
    if (!itemId) return [];

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "ebay_reviews");
    url.searchParams.set("item_id", itemId);
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const reviews = data.reviews || [];

    return reviews.slice(0, maxReviews).map((r: Record<string, unknown>): ReviewSnippet => ({
      text: String(r.comment || r.text || r.body || ""),
      rating: Number(r.rating || 0),
      source: "eBay",
      author: String(r.buyer_username || r.author || ""),
      date: String(r.review_date || r.date || ""),
    })).filter((r: ReviewSnippet) => r.text.length > 10);
  } catch {
    return [];
  }
}

/** Main function to fetch reviews based on source */
export async function fetchReviewsForProduct(product: RawSourceResult, apiKey: string, maxReviews: number = 20): Promise<ReviewSnippet[]> {
  if (!apiKey || !product.link || product.link === "#") return [];

  try {
    if (product.source === "Amazon") {
      return await fetchAmazonReviews(product.link, apiKey, maxReviews);
    } else if (product.source === "Google Shopping") {
      return await fetchGoogleShoppingReviews(product.link, apiKey, maxReviews);
    } else if (product.source === "Walmart") {
      return await fetchWalmartReviews(product.link, apiKey, maxReviews);
    } else if (product.source === "eBay") {
      return await fetchEbayReviews(product.link, apiKey, maxReviews);
    }
  } catch {
    // Ignore errors, return empty
  }
  return [];
}