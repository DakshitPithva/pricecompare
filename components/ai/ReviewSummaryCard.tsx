"use client";

import { useState } from "react";

interface Props {
  productName: string;
  reviews?: { text: string; rating: number; source: string }[];
}

interface ReviewData {
  pros: string[];
  cons: string[];
  complaints: string[];
  verdict: string;
  rating: number;
}

export default function ReviewSummaryCard({ productName, reviews }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewData | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const summarize = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/review-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, reviews: reviews || [] }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
      setExpanded(true);
    } catch {
      setError("Could not summarize reviews. Try again.");
    }
    setLoading(false);
  };

  if (result && expanded) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span className="text-lg">📝</span> AI Review Summary
          </h3>
          <div className="flex items-center gap-1">
            <span className="text-amber-500">{"★".repeat(Math.round(result.rating))}</span>
            <span className="text-xs text-text-muted ml-1">{result.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Pros
            </p>
            <ul className="space-y-1">
              {result.pros.map((p, i) => <li key={i} className="text-xs text-emerald-800">• {p}</li>)}
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              Cons
            </p>
            <ul className="space-y-1">
              {result.cons.map((c, i) => <li key={i} className="text-xs text-red-800">• {c}</li>)}
            </ul>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              Common Issues
            </p>
            <ul className="space-y-1">
              {result.complaints.map((c, i) => <li key={i} className="text-xs text-amber-800">• {c}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-surface-dim rounded-lg p-3 mb-3">
          <p className="text-sm text-text-primary font-medium">{result.verdict}</p>
        </div>

        <button onClick={() => setExpanded(false)} className="text-xs text-primary hover:underline">Collapse</button>
      </div>
    );
  }

  return (
    <button
      onClick={summarize}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      )}
      {loading ? "Summarizing..." : "AI Review Summary"}
      {error && <span className="text-error ml-1">{error}</span>}
    </button>
  );
}
