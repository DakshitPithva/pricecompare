import { RawSourceResult } from "../normalize";

function detectCurrency(priceStr: string): string {
  if (!priceStr) return "USD";
  if (priceStr.includes("₹")) return "INR";
  if (priceStr.includes("$")) return "USD";
  if (priceStr.includes("EUR") || priceStr.includes("€")) return "EUR";
  if (priceStr.includes("GBP") || priceStr.includes("£")) return "GBP";
  return "USD";
}

export async function searchWalmart(query: string, apiKey: string): Promise<RawSourceResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "walmart");
  url.searchParams.set("query", query);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Walmart API error: ${res.status}`);

  const data = await res.json();
  const items = data.organic_results || [];

  return items.map((item: Record<string, unknown>): RawSourceResult => {
    const priceStr = String(item.price || "");
    const currency = item.currency ? String(item.currency) : detectCurrency(priceStr);
    return {
      title: (item.title as string) || "",
      price: parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0,
      currency,
      image: (item.thumbnail as string) || "",
      link: (item.link as string) || "#",
      rating: item.rating ? Number(item.rating) : undefined,
      reviews: item.reviews ? Number(String(item.reviews).replace(/[^0-9]/g, "")) : undefined,
      description: (item.snippet as string) || undefined,
      shipping: "Free Delivery",
    };
  });
}
