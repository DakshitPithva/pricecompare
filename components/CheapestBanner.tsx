"use client";

interface CheapestBannerProps {
  source: string;
  price: number;
  currency: string;
  savings?: number;
}

function formatINR(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function CheapestBanner({ source, price, savings }: CheapestBannerProps) {
  return (
    <div className="bg-accent-green-bg border border-accent-green-border rounded-xl p-4 sm:p-5 animate-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-green rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-accent-green uppercase tracking-wide">Lowest Price Verified</p>
            <p className="text-base font-bold text-text-primary">
              {source} <span className="text-accent-green font-bold">{formatINR(price)}</span>
              {savings && savings > 0 && (
                <span className="text-sm font-medium text-text-muted ml-2">
                  Save {formatINR(savings)} vs next best
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Automated SerpApi Cache Sync
        </div>
      </div>
    </div>
  );
}
