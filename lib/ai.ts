const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ====== Buy or Wait Predictor ======

export interface BuyOrWaitResult {
  recommendation: "buy_now" | "wait";
  confidence: number;
  reasoning: string;
  expectedDrop: string;
  bestTimeToBuy: string;
  festiveSale?: string;
}

export async function predictBuyOrWait(
  productName: string,
  currentPrice: number,
  source: string,
  priceHistory?: { price: number; date: string }[]
): Promise<BuyOrWaitResult> {
  const today = new Date().toISOString().split("T")[0];
  
  let historyText = "No price history available.";
  let avgPrice: number | null = null;
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let trend: "up" | "down" | "flat" = "flat";

  if (priceHistory?.length) {
    const prices = priceHistory.map((p) => p.price).filter((p) => p > 0);
    if (prices.length > 0) {
      avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
      // Simple trend: compare first vs last
      trend = prices[prices.length - 1] > prices[0] ? "up" : prices[prices.length - 1] < prices[0] ? "down" : "flat";
      historyText = `Price history (${prices.length} data points): ${priceHistory.map((p) => `${p.date}: ₹${p.price}`).join(", ")}`;
    }
  }

  const dealScore = avgPrice && currentPrice < avgPrice ? Math.round(((avgPrice - currentPrice) / avgPrice) * 100) : null;

  const prompt = `You are an Indian e-commerce price analyst. Today is ${today}.

Product: ${productName}
Current Price: ₹${currentPrice.toLocaleString("en-IN")}
Source: ${source}
${historyText}
${avgPrice !== null ? `Average price (last 30 days): ₹${Math.round(avgPrice).toLocaleString("en-IN")}` : ""}
${minPrice !== null ? `Lowest price: ₹${minPrice.toLocaleString("en-IN")}` : ""}
${maxPrice !== null ? `Highest price: ₹${maxPrice.toLocaleString("en-IN")}` : ""}
${dealScore !== null ? `Deal score: ${dealScore}% below average` : ""}
Price trend: ${trend}

Indian festive sale calendar (2026):
- Amazon Great Indian Festival: Oct 1-7 (Diwali period)
- Flipkart Big Billion Days: Sep 20-Oct 5
- Amazon Prime Day: July 15-16
- Republic Day Sale: Jan 20-25
- Independence Day Sale: Aug 6-15
- Diwali: Nov 1, 2026
- Christmas/Year End: Dec 20-31

Rules:
- If price history shows a clear downward trend, recommend "wait" with higher confidence
- If current price is at or near historical low, recommend "buy_now"
- If an major sale is within 2 weeks, consider recommending "wait" for the sale
- Be conservative: don't invent fake history; if no data, say so explicitly and give lower confidence

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "recommendation": "buy_now" or "wait",
  "confidence": number 0-100,
  "reasoning": "brief explanation in 2-3 sentences",
  "expectedDrop": "expected percentage drop if waiting (e.g., '5-10%')",
  "bestTimeToBuy": "specific timeframe (e.g., 'Next 1-2 weeks', 'During Great Indian Festival Oct 1-7')",
  "festiveSale": "name of upcoming sale if applicable, or null"
}`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]) as BuyOrWaitResult;
}

// ====== Review Summarizer ======

export interface ReviewSummary {
  pros: string[];
  cons: string[];
  complaints: string[];
  verdict: string;
  rating: number;
  reviewsAvailable: boolean;
}

export async function summarizeReviews(
  productName: string,
  reviews: { text: string; rating: number; source: string }[]
): Promise<ReviewSummary> {
  if (!reviews || reviews.length === 0) {
    return {
      pros: [],
      cons: [],
      complaints: [],
      verdict: "No detailed reviews available for this listing from the retailer.",
      rating: 0,
      reviewsAvailable: false,
    };
  }

  const reviewText = reviews
    .slice(0, 20)
    .map((r) => `[${r.source} - ${r.rating}★] ${r.text}`)
    .join("\n");

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const prompt = `Summarize these REAL product reviews for "${productName}" into a concise buyer's guide.

Reviews:
${reviewText}

Rules:
- Only extract insights from the actual review text provided above.
- Do NOT invent or assume pros/cons not mentioned in the reviews.
- If reviews are too generic or sparse, reflect that in the summary.

Respond in this EXACT JSON format (no markdown):
{
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2", "con 3"],
  "complaints": ["common complaint 1", "common complaint 2"],
  "verdict": "one-line overall verdict based on actual reviews",
  "rating": number 1-5 (average sentiment, use ${avgRating.toFixed(1)} as baseline)
}`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  const result = JSON.parse(jsonMatch[0]) as ReviewSummary;
  return { ...result, reviewsAvailable: true };
}

// ====== Semantic Search ======

export interface SemanticResult {
  products: {
    name: string;
    price: number;
    source: string;
    why: string;
  }[];
  explanation: string;
}

export interface StructuredQuery {
  brand?: string;
  model?: string;
  category?: string;
  max_price?: number;
  min_price?: number;
  use_case?: string;
  original_query: string;
}

/** Extract structured query from natural language using Gemini */
export async function extractStructuredQuery(userQuery: string): Promise<StructuredQuery> {
  const prompt = `Extract structured search parameters from this natural language product query.

Query: "${userQuery}"

Extract the following as JSON (all fields optional except original_query):
{
  "brand": "brand name if mentioned (e.g., Apple, Sony, Samsung)",
  "model": "specific model if mentioned (e.g., iPhone 15, WH-1000XM5, Galaxy S24)",
  "category": "product category (e.g., headphones, laptop, phone, watch)",
  "max_price": number (maximum budget in INR if mentioned, e.g., 10000),
  "min_price": number (minimum budget in INR if mentioned),
  "use_case": "intended use if mentioned (e.g., gaming, college, gym, travel, work)",
  "original_query": "${userQuery}"
}

Rules:
- Only extract what is explicitly stated or clearly implied.
- For price, convert to INR numbers (e.g., "under 10k" → 10000, "under ₹50,000" → 50000).
- If nothing specific is found for a field, omit it or use null.
- Return ONLY the JSON object, no markdown.`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: return minimal structure
    return { original_query: userQuery };
  }
  const parsed = JSON.parse(jsonMatch[0]) as StructuredQuery;
  // Ensure original_query is always present
  return { ...parsed, original_query: userQuery };
}

export async function semanticSearch(
  userQuery: string,
  availableProducts: { title: string; price: number; source: string; description?: string }[]
): Promise<SemanticResult> {
  if (availableProducts.length === 0) {
    return {
      products: [],
      explanation: "No products found matching your query. Try searching with different keywords.",
    };
  }

  const productsText = availableProducts
    .map((p, i) => `${i + 1}. ${p.title} — ₹${p.price.toLocaleString("en-IN")} (${p.source})${p.description ? ` | ${p.description}` : ""}`)
    .join("\n");

  const prompt = `You are a product search assistant. The user wants: "${userQuery}"

Here are REAL products found from price comparison across Google Shopping, Amazon, Walmart, and eBay:
${productsText}

RULES:
- ONLY pick from the list above. Do NOT invent or suggest products not in the list.
- Pick the TOP 3 products that BEST match what the user is looking for.
- If the user mentions a specific product (e.g. "iPhone 15", "Sony headphones"), prioritize exact matches for that product.
- If the user mentions a budget (e.g. "under ₹10,000"), filter to products within that budget.
- If the user mentions a use case (e.g. "for college", "for gym"), consider which products fit that use case.

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "products": [
    { "name": "exact product title from the list", "price": number, "source": "source name", "why": "specific reason this matches the user's need" }
  ],
  "explanation": "brief 1-2 sentence explanation of why these products were selected"
}`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]) as SemanticResult;
}

// ====== Product Comparison ======

export interface ComparisonTable {
  title: string;
  products: {
    name: string;
    source: string;
    price: number;
    image: string;
    link: string;
  }[];
  specs: Record<string, string>[];
  verdict: string;
  winner: string;
}

/** Fetch detailed product specs from SerpApi product API (if available) */
async function fetchProductDetails(productUrl: string, apiKey: string): Promise<Record<string, string> | null> {
  try {
    const url = new URL(productUrl);
    url.searchParams.set("api_key", apiKey);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    // Extract specifications from various possible fields
    const specs: Record<string, string> = {};
    if (data.specifications) {
      Object.assign(specs, data.specifications);
    }
    if (data.product_details) {
      Object.assign(specs, data.product_details);
    }
    if (data.attributes) {
      Object.assign(specs, data.attributes);
    }
    return Object.keys(specs).length > 0 ? specs : null;
  } catch {
    return null;
  }
}

export async function compareProducts(
  products: { title: string; price: number; source: string; image: string; link: string; description?: string; rating?: number; reviews?: number }[],
  apiKey?: string
): Promise<ComparisonTable> {
  const productsText = products
    .map((p, i) => `${i + 1}. ${p.title} — ₹${p.price.toLocaleString("en-IN")} (${p.source})${p.rating ? ` | ${p.rating}★ (${p.reviews || 0} reviews)` : ""}${p.description ? ` | ${p.description}` : ""}`)
    .join("\n");

  // Try to fetch real specs for each product if API key provided
  const productSpecs: Record<string, string>[] = [];
  if (apiKey) {
    for (const p of products) {
      const specs = await fetchProductDetails(p.link, apiKey);
      productSpecs.push(specs || {});
    }
  }

  const specsText = productSpecs.length > 0 
    ? "\n\nReal specifications from product APIs:\n" + productSpecs.map((s, i) => `Product ${i + 1}: ${JSON.stringify(s) || "No structured specs available"}`).join("\n")
    : "";

  const prompt = `Compare these products side-by-side. Create a detailed comparison using ONLY the data provided below.

Products:
${productsText}
${specsText}

RULES:
- Only use the fields provided above (title, price, source, rating, review count, description, shipping, and any real specifications from product APIs).
- If a specification is not present in the data, write "Not listed" — DO NOT infer or guess technical specifications like RAM, chip, screen size, etc.
- Compare on: price, rating/review count, source reputation, shipping, and any REAL specs that are actually provided.
- The "specs" output should be a list of objects where each object represents one feature row comparing all products.

Respond in this EXACT JSON format (no markdown):
{
  "title": "Comparison: [product category]",
  "products": [
    { "name": "product name", "source": "source", "price": number, "image": "", "link": "" }
  ],
  "specs": [
    { "Feature": "Price", "Product 1": "₹X", "Product 2": "₹Y", ... },
    { "Feature": "Rating", "Product 1": "4.5★ (1000 reviews)", "Product 2": "4.2★ (500 reviews)", ... },
    { "Feature": "Source", "Product 1": "Amazon", "Product 2": "eBay", ... },
    { "Feature": "Shipping", "Product 1": "Prime", "Product 2": "Free", ... },
    { "Feature": "Real Spec (if any)", "Product 1": "value or Not listed", "Product 2": "value or Not listed", ... }
  ],
  "verdict": "overall recommendation based on available data",
  "winner": "name of best value product"
}`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]) as ComparisonTable;
}
