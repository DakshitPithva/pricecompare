"use client";

import { useState } from "react";

interface Props {
  productName: string;
  currentPrice: number;
  source: string;
}

interface BuyOrWaitData {
  recommendation: "buy_now" | "wait";
  confidence: number;
  reasoning: string;
  expectedDrop: string;
  bestTimeToBuy: string;
  festiveSale?: string;
}

export default function BuyOrWaitButton({ productName, currentPrice, source }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuyOrWaitData | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/buy-or-wait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, currentPrice, source }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not analyze. Try again.");
    }
    setLoading(false);
  };

  if (result) {
    const isBuy = result.recommendation === "buy_now";
    return (
      <div className={`rounded-xl border p-4 ${isBuy ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isBuy ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
            {isBuy ? "🛒" : "⏳"}
          </div>
          <div>
            <p className={`text-sm font-bold ${isBuy ? "text-emerald-700" : "text-amber-700"}`}>
              {isBuy ? "BUY NOW" : "WAIT"}
            </p>
            <p className="text-xs text-text-muted">{result.confidence}% confidence</p>
          </div>
        </div>
        <p className="text-sm text-text-primary mb-2">{result.reasoning}</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-text-muted">Expected drop: <strong>{result.expectedDrop}</strong></span>
          <span className="text-text-muted">Best time: <strong>{result.bestTimeToBuy}</strong></span>
          {result.festiveSale && <span className="text-primary font-medium">🎉 {result.festiveSale}</span>}
        </div>
        <button onClick={() => setResult(null)} className="mt-3 text-xs text-primary hover:underline">Analyze again</button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1.5 items-start">
      {error && <p className="text-xs text-error">{error}</p>}
      <button
        onClick={analyze}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        )}
        {loading ? "Analyzing..." : "AI Buy or Wait"}
      </button>
    </div>
  );
}
