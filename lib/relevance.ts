import { NormalizedResult } from "@/lib/normalize";
import { callGemini } from "@/lib/ai";

const ACCESSORY_TERMS = [
  "cover", "case", "sleeve", "skin", "protector", "stand", "adapter",
  "charger only", "compatible for", "compatible with", "for macbook",
  "screen guard", "keyboard cover", "replacement", "spare part",
  "tempered glass", "film", "back cover", "hard case", "soft case",
  "pouch", "bag", "carrying case", "skin wrap", "decal", "sticker",
  "stand", "dock", "hub", "dongle", "cable only", "charger",
  "battery", "replacement battery", "battery case",
  "hinge", "mount", "bracket", "clip", "strap", "lanyard",
];

const priceBandCache = new Map<string, { min: number; max: number }>();

function passesBlacklist(query: string, title: string): boolean {
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  const queryHasAccessoryTerm = ACCESSORY_TERMS.some((term) => q.includes(term));
  if (queryHasAccessoryTerm) return true;
  return !ACCESSORY_TERMS.some((term) => t.includes(term));
}

function tokenOverlapScore(query: string, title: string): number {
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (queryTokens.length === 0) return 1;
  const titleLower = title.toLowerCase();
  const matched = queryTokens.filter((t) => titleLower.includes(t)).length;
  return matched / queryTokens.length;
}

async function getPriceBand(query: string): Promise<{ min: number; max: number } | null> {
  const cached = priceBandCache.get(query.toLowerCase());
  if (cached) return cached;

  try {
    const prompt = `What is a realistic price range in INR for a genuine "${query}"? Reply with ONLY a JSON object: {"min": number, "max": number}. No markdown, no explanation.`;
    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const band = JSON.parse(jsonMatch[0]) as { min: number; max: number };
    if (band.min > 0 && band.max > band.min) {
      priceBandCache.set(query.toLowerCase(), band);
      return band;
    }
  } catch {
    // ignore, fall through to no price band
  }
  return null;
}

function passesPriceBand(price: number, band: { min: number; max: number } | null): boolean {
  if (!band) return true;
  const buffer = 0.5;
  return price >= band.min * (1 - buffer) && price <= band.max * (1 + buffer);
}

async function aiRerank(query: string, results: NormalizedResult[]): Promise<NormalizedResult[]> {
  if (results.length === 0) return results;

  const productsText = results
    .map((r, i) => `${i}: "${r.title}" — ₹${r.price.toLocaleString("en-IN")} (${r.source})`)
    .join("\n");

  const prompt = `Here is a list of search results for the query "${query}".
Return ONLY the indices (0-based) of results that are genuinely the product being searched for — exclude accessories, unrelated bundles, and parts.

Results:
${productsText}

Respond with ONLY a JSON array of indices to keep, e.g.: [0, 2, 3]`;

  try {
    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return results;
    const keepIndices = JSON.parse(jsonMatch[0]) as number[];
    return keepIndices
      .filter((i) => i >= 0 && i < results.length)
      .map((i) => results[i]);
  } catch {
    return results;
  }
}

export async function filterResults(query: string, results: NormalizedResult[]): Promise<NormalizedResult[]> {
  // Layer 1: Blacklist filter
  let filtered = results.filter((r) => passesBlacklist(query, r.title));

  // Layer 2: Token overlap scoring (>= 0.6)
  filtered = filtered.filter((r) => tokenOverlapScore(query, r.title) >= 0.6);

  // Layer 3: Price-band sanity check
  const band = await getPriceBand(query);
  filtered = filtered.filter((r) => passesPriceBand(r.price, band));

  // Layer 4: AI reranking (final pass on smaller set)
  if (filtered.length > 1) {
    filtered = await aiRerank(query, filtered);
  }

  return filtered;
}