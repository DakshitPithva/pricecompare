export interface RawSourceResult {
  title: string;
  price: number;
  currency: string;
  image: string;
  link: string;
  rating?: number;
  reviews?: number;
  originalPrice?: number;
  description?: string;
  specifications?: Record<string, string>;
  shipping?: string;
  source?: string;
}

export interface NormalizedResult {
  source: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  link: string;
  rating?: number;
  reviews?: number;
  originalPrice?: number;
  description?: string;
  specifications?: Record<string, string>;
  shipping?: string;
  productId?: number;
}

export function normalizeResult(source: string, raw: RawSourceResult): NormalizedResult {
  const converted = convertToINR(raw.price, raw.currency);
  const origConverted = raw.originalPrice ? convertToINR(raw.originalPrice, raw.currency) : undefined;
  return {
    source,
    title: raw.title || "Unknown product",
    price: typeof converted.price === "number" && !isNaN(converted.price) ? converted.price : 0,
    currency: "INR",
    image: raw.image || "",
    link: raw.link || "#",
    rating: raw.rating && raw.rating > 0 && raw.rating <= 5 ? raw.rating : undefined,
    reviews: raw.reviews && raw.reviews > 0 ? raw.reviews : undefined,
    originalPrice: origConverted?.price,
    description: raw.description || undefined,
    specifications: raw.specifications || undefined,
    shipping: raw.shipping || undefined,
  };
}

export function sortResults(results: NormalizedResult[]): NormalizedResult[] {
  return results
    .filter((r) => r.price > 0)
    .sort((a, b) => a.price - b.price);
}

export function findCheapest(results: NormalizedResult[]): { source: string; price: number } | null {
  const sorted = sortResults(results);
  if (sorted.length === 0) return null;
  return { source: sorted[0].source, price: sorted[0].price };
}

export function formatINR(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Approximate USD → INR rate (used when API returns USD prices)
const USD_TO_INR = 84;

export function convertToINR(price: number, currency: string): { price: number; currency: string } {
  if (!currency || currency.toUpperCase() === "INR") {
    return { price, currency: "INR" };
  }
  if (currency.toUpperCase() === "USD") {
    return { price: Math.round(price * USD_TO_INR), currency: "INR" };
  }
  return { price, currency: "INR" };
}
