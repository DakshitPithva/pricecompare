"use client";

import { useState } from "react";

interface SemanticResult {
  products: { name: string; price: number; source: string; why: string }[];
  explanation: string;
}

interface Props {
  onResults?: (results: SemanticResult) => void;
}

export default function SemanticSearch({ onResults }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SemanticResult | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: query, availableProducts: [] }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
      onResults?.(data);
    } catch {
      setError("AI search failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder='Describe what you need... e.g. "Best headphones for college under ₹10,000"'
          className="w-full pl-12 pr-24 py-4 bg-surface border border-outline-variant rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Ask AI"}
        </button>
      </div>

      {error && <p className="text-xs text-error mt-2">{error}</p>}

      {result && (
        <div className="mt-4 bg-surface border border-outline-variant rounded-xl p-5">
          <p className="text-xs text-text-muted mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Recommendation
          </p>
          <p className="text-sm text-text-secondary mb-4">{result.explanation}</p>
          <div className="space-y-3">
            {result.products.map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-surface-dim rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.source} — ₹{p.price.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-primary mt-0.5">{p.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
