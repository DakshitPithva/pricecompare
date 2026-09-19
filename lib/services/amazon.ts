import { RawSourceResult } from "../normalize";

function detectCurrency(priceStr: string): string {
  if (!priceStr) return "USD";
  if (priceStr.includes("₹")) return "INR";
  if (priceStr.includes("$")) return "USD";
  if (priceStr.includes("EUR") || priceStr.includes("€")) return "EUR";
  if (priceStr.includes("GBP") || priceStr.includes("£")) return "GBP";
  return "USD";
}

export async function searchAmazon(query: string, apiKey: string): Promise<RawSourceResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "amazon");
  url.searchParams.set("k", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("amazon_domain", "amazon.in");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Amazon API error: ${res.status}`);

  const data = await res.json();
  const items = data.organic_results || [];

  return items.map((item: Record<string, unknown>): RawSourceResult => {
    const priceRaw = item.price;
    let priceVal = 0;
    let priceStr = "";
    if (typeof priceRaw === "object" && priceRaw !== null && "value" in priceRaw) {
      priceStr = String((priceRaw as Record<string, unknown>).raw || (priceRaw as Record<string, unknown>).value || "");
      priceVal = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
    } else {
      priceStr = String(priceRaw || "");
      priceVal = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
    }
    const currency = item.currency ? String(item.currency) : detectCurrency(priceStr);
    return {
      title: (item.title as string) || "",
      price: priceVal,
      currency,
      image: (item.thumbnail as string) || "",
      link: (item.link as string) || "#",
      rating: item.rating ? Number(item.rating) : undefined,
      reviews: item.reviews ? Number(String(item.reviews).replace(/[^0-9]/g, "")) : undefined,
      description: (item.snippet as string) || undefined,
      shipping: "Prime Available",
    };
  });
}
