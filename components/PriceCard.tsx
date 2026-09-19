"use client";

import { useState } from "react";

interface PriceCardProps {
  source: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  link: string;
  rating?: number;
  reviews?: number;
  isCheapest?: boolean;
  originalPrice?: number;
  description?: string;
  shipping?: string;
  productId?: number;
}

const sourceConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  Amazon: { color: "text-amber-600", bg: "bg-amber-50", label: "Amazon India", icon: "Amz" },
  Walmart: { color: "text-walmart", bg: "bg-blue-50", label: "Walmart", icon: "W" },
  eBay: { color: "text-ebay", bg: "bg-red-50", label: "eBay", icon: "eB" },
  "Google Shopping": { color: "text-google", bg: "bg-blue-50", label: "Google Shopping", icon: "G" },
};

function formatINR(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function SourceIcon({ source }: { source: string }) {
  const config = sourceConfig[source] || { bg: "bg-gray-50", icon: source[0], color: "text-text-secondary" };
  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${config.bg} ${config.color}`}>
      {config.icon}
    </div>
  );
}

export default function PriceCard({
  source,
  title,
  price,
  image,
  link,
  rating,
  reviews,
  isCheapest,
  originalPrice,
  description,
  shipping,
  productId,
}: PriceCardProps) {
  const config = sourceConfig[source] || { label: source };
  const [tracking, setTracking] = useState<"idle" | "tracking" | "tracked" | "error">("idle");
  const [isTracked, setIsTracked] = useState(false);

  const handleTrack = async () => {
    if (tracking !== "idle") return;
    setTracking("tracking");
    try {
      if (isTracked) {
        // Untrack
        const res = await fetch(`/api/track?productId=${productId}`, { method: "DELETE", credentials: "include" });
        if (res.ok) {
          setIsTracked(false);
          setTracking("idle");
        } else {
          setTracking("error");
        }
      } else {
        // Track
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId,
            title,
            source,
            externalUrl: link,
            imageUrl: image,
            type: "wishlist",
          }),
        });
        if (res.ok) {
          setIsTracked(true);
          setTracking("idle");
        } else {
          setTracking("error");
        }
      }
    } catch {
      setTracking("error");
    }
  };

  return (
    <div
      className={`group relative bg-surface rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
        isCheapest
          ? "border-accent-green-border shadow-featured"
          : "border-outline-variant shadow-card hover:shadow-card-hover hover:border-outline"
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          {image ? (
            <div className="w-20 h-20 rounded-lg bg-surface-dim border border-outline-variant overflow-hidden flex-shrink-0">
              <img src={image} alt={title} className="w-full h-full object-contain p-1" loading="lazy" />
            </div>
          ) : (
            <SourceIcon source={source} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-text-primary">{config.label}</span>
              {isCheapest && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-green bg-accent-green-bg border border-accent-green-border px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cheapest
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-text-primary line-clamp-2 mb-1">{title}</p>

            {description && (
              <p className="text-xs text-text-muted line-clamp-1 mb-1">{description}</p>
            )}

            {(rating || reviews || shipping) && (
              <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                {rating && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {rating}
                  </span>
                )}
                {reviews && <span>({reviews.toLocaleString("en-IN")} reviews)</span>}
                {shipping && <span className="text-accent-green">{shipping}</span>}
              </div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-tabular text-text-primary">
                {formatINR(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-text-muted line-through">
                  {formatINR(originalPrice)}
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <p className="text-xs text-accent-green font-medium mt-0.5">
                Save {formatINR(originalPrice - price)}
              </p>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Buy on {config.label}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
              {productId && (
                <button
                  onClick={handleTrack}
                  disabled={tracking !== "idle"}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
                    isTracked
                      ? "bg-gray-100 text-gray-700 border border-gray-300"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  } ${tracking !== "idle" ? "opacity-50 cursor-wait" : ""}`}
                >
                  {tracking === "tracking" && <span className="animate-spin">⏳</span>}
                  {isTracked ? (
                    <>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                      Save
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
