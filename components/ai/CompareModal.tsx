"use client";

import { useState } from "react";

interface Product {
  title: string;
  price: number;
  source: string;
  image: string;
  link: string;
  description?: string;
}

interface Props {
  products: Product[];
  query: string;
}

interface ComparisonData {
  title: string;
  products: { name: string; source: string; price: number; image: string; link: string }[];
  specs: Record<string, string>[];
  verdict: string;
  winner: string;
}

export default function CompareModal({ products, query }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonData | null>(null);
  const [error, setError] = useState("");

  const compare = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          products: products.map((p) => ({
            title: p.title,
            price: p.price,
            source: p.source,
            image: p.image,
            link: p.link,
            description: p.description,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("AI comparison failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={compare}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        AI Compare Selected
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-outline-variant px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="text-xl">⚖️</span> AI Side-by-Side Comparison
              </h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-dim flex items-center justify-center text-text-muted">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-[3px] border-outline-variant border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-sm text-text-muted">AI is comparing products...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-error">{error}</p>
                  <button onClick={compare} className="mt-3 text-sm text-primary hover:underline">Try again</button>
                </div>
              ) : result ? (
                <div>
                  <h3 className="text-sm font-bold text-text-primary mb-4">{result.title}</h3>

                  {/* Specs Table */}
                  {result.specs.length > 0 && (
                    <div className="overflow-x-auto mb-5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-outline-variant">
                            {Object.keys(result.specs[0]).map((key) => (
                              <th key={key} className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.specs.map((row, i) => (
                            <tr key={i} className="border-b border-outline-variant/50">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="py-2 px-3 text-xs text-text-primary">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Product Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    {result.products.map((p, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${p.name === result.winner ? "border-primary bg-primary/5" : "border-outline-variant"}`}>
                        {p.name === result.winner && <span className="text-xs font-bold text-primary">🏆 Best Value</span>}
                        <p className="text-sm font-medium text-text-primary mt-1 line-clamp-2">{p.name}</p>
                        <p className="text-xs text-text-muted mt-1">{p.source}</p>
                        <p className="text-lg font-bold text-primary mt-2">₹{p.price.toLocaleString("en-IN")}</p>
                        {p.link && p.link !== "#" && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                            View Deal →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Verdict */}
                  <div className="bg-surface-dim rounded-xl p-4">
                    <p className="text-sm font-bold text-text-primary mb-1">AI Verdict</p>
                    <p className="text-sm text-text-secondary">{result.verdict}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
