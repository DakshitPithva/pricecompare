import { RawSourceResult } from "../normalize";

export async function searchEbay(query: string, apiKey: string): Promise<RawSourceResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "ebay");
  url.searchParams.set("_nkw", query);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`eBay API error: ${res.status}`);

  const data = await res.json();
  const items = data.organic_results || [];

  return items.map((item: Record<string, unknown>): RawSourceResult => {
    const priceRaw = item.price;
    let priceVal = 0;
    let currency = "USD";
    if (typeof priceRaw === "object" && priceRaw !== null) {
      const priceObj = priceRaw as Record<string, unknown>;
      priceVal = parseFloat(String(priceObj.raw || priceObj.value || "0").replace(/[^0-9.]/g, "")) || 0;
      if (priceObj.currency) currency = String(priceObj.currency);
      // Detect currency from raw string if not set (e.g. "$299.99")
      if (!priceObj.currency && typeof priceObj.raw === "string") {
        if (priceObj.raw.includes("₹")) currency = "INR";
        else if (priceObj.raw.includes("$")) currency = "USD";
        else if (priceObj.raw.includes("EUR") || priceObj.raw.includes("€")) currency = "EUR";
        else if (priceObj.raw.includes("GBP") || priceObj.raw.includes("£")) currency = "GBP";
      }
    } else {
      priceVal = parseFloat(String(priceRaw || "0").replace(/[^0-9.]/g, "")) || 0;
      // Detect from string
      const rawStr = String(priceRaw || "");
      if (rawStr.includes("₹")) currency = "INR";
      else if (rawStr.includes("$")) currency = "USD";
      else if (rawStr.includes("EUR") || rawStr.includes("€")) currency = "EUR";
      else if (rawStr.includes("GBP") || rawStr.includes("£")) currency = "GBP";
    }
    const seller = item.seller as Record<string, unknown> | undefined;
    return {
      title: (item.title as string) || "",
      price: priceVal,
      currency,
      image: (item.thumbnail as string) || "",
      link: (item.link as string) || "#",
      rating: undefined,
      reviews: seller?.feedback_score ? Number(seller.feedback_score) : undefined,
      description: (item.condition as string) || undefined,
      shipping: "Free Shipping",
    };
  });
}
