"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PriceChart, DealScoreBadge } from "@/components/charts/PriceChart";
import { formatINR } from "@/lib/normalize";

interface ProductDetailData {
  product: {
    id: number;
    title: string;
    source: string;
    externalUrl: string;
    category: string | null;
    image: string | null;
    condition: string;
    currentPrice: number | null;
    mrp: number | null;
    discount: number | null;
    rating: number;
    reviewCount: number;
    priceHistory: { date: string; price: number }[];
    stats: {
      currentPrice: number | null;
      lowestEver: number | null;
      highestEver: number | null;
      avg30d: number | null;
      dealScore: number | null;
      dataPoints: number;
    };
    offers: { source: string; title: string; image: string | null; link: string | null; condition: string }[];
    deliveryEstimate: string;
    inStock: boolean;
  };
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetailData["product"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch product data
  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        if (!cancelled) {
          if (data.error) throw new Error(data.error);
          setProduct(data.product);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-lg font-semibold text-text-primary mb-2">Product not found</p>
            <p className="text-sm text-text-muted mb-4">{error || "Unknown error"}</p>
            <button onClick={() => router.back()} className="text-primary hover:underline">Go back</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { title, source, externalUrl, category, image, condition, currentPrice, mrp, discount, rating, reviewCount, priceHistory, stats, offers, deliveryEstimate } = product;

  const images = [image].filter(Boolean) as string[];
  const allImages = images.length > 0 ? images : ["/placeholder-product.svg"];

  // Convert null to undefined for chart components
  const chartCurrentPrice = stats.currentPrice ?? undefined;
  const chartLowestEver = stats.lowestEver ?? undefined;
  const chartHighestEver = stats.highestEver ?? undefined;
  const chartAvg30d = stats.avg30d ?? undefined;
  const chartDealScore = stats.dealScore ?? undefined;

  const conditionColors: Record<string, string> = {
    New: "bg-green-100 text-green-700",
    Refurbished: "bg-amber-100 text-amber-700",
    "Open Box": "bg-blue-100 text-blue-700",
    Used: "bg-gray-100 text-gray-700",
  };

  const handleShare = () => {
    const message = encodeURIComponent(`Check this out: ${title}\n${externalUrl}`);
    const waLink = `https://wa.me/?text=${message}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-surface border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm text-text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              {category && (
                <>
                  <Link href={`/results?q=${encodeURIComponent(category)}`} className="hover:text-primary">{category}</Link>
                  <span>/</span>
                </>
              )}
              <span className="text-text-primary truncate max-w-xs" aria-current="page">{title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-3">
              <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
                {/* Main Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={title}
                    className="w-full h-full object-contain p-4 bg-white"
                  />
                </div>
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                          idx === selectedImageIndex
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant hover:border-outline"
                        }`}
                        aria-label={`View image ${idx + 1}`}
                        aria-current={idx === selectedImageIndex ? "true" : "false"}
                      >
                        <img src={img} alt={`${title} - Image ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price History Mini Chart */}
              <div className="mt-6">
                <PriceChart
                  snapshots={priceHistory.map((p) => ({ price: p.price, checked_at: p.date }))}
                  currentPrice={chartCurrentPrice}
                  lowestEver={chartLowestEver}
                  highestEver={chartHighestEver}
                  productTitle={title}
                />
              </div>
            </div>

            {/* Right: Product Info + Sticky Buy Panel */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-6">
                {/* Product Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{source}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conditionColors[condition] || "bg-gray-100 text-gray-700"}`}>{condition}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">{title}</h1>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="font-medium">{rating}</span>
                    </div>
                    <span>({reviewCount.toLocaleString("en-IN")} reviews)</span>
                    <span>•</span>
                    <span className="text-accent-green">{deliveryEstimate}</span>
                  </div>
                </div>

                {/* Price Block */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold font-tabular text-text-primary">
                      {currentPrice ? formatINR(currentPrice) : "Price unavailable"}
                    </span>
                    {mrp && currentPrice && mrp > currentPrice && (
                      <span className="text-xl text-text-muted line-through">{formatINR(mrp)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {discount && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {discount}% off
                      </span>
                    )}
                    {stats.dealScore !== null && stats.dealScore > 0 && (
                      <DealScoreBadge dealScore={chartDealScore} currentPrice={chartCurrentPrice} avgPrice={chartAvg30d} />
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {stats.dataPoints > 1
                      ? `${stats.dataPoints} price points • Lowest: ${stats.lowestEver ? formatINR(stats.lowestEver) : "—"} • Highest: ${stats.highestEver ? formatINR(stats.highestEver) : "—"}`
                      : "Price history is still being collected"}
                  </p>
                </div>

                {/* Buy Panel */}
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-dim rounded-lg">
                    <div>
                      <p className="text-sm text-text-muted">In Stock</p>
                      <p className="text-lg font-bold text-text-primary">{formatINR(currentPrice || 0)}</p>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Ready to Ship</span>
                  </div>

                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                  >
                    Buy on {source}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>

                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-green-600 font-medium border border-green-300 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382A10.043 10.043 0 0012 6C6.477 6 2 10.477 2 16c0 2.354.94 4.54 2.472 6.382.12.14.27.22.43.22.14 0 .29-.05.42-.14l3.127-1.877A5.99 5.99 0 0012 20c4.971 0 9-4.029 9-9s-4.029-9-9-9c-2.075 0-4.017.839-5.488 2.212l-1.428-1.428C5.95 3.397 8.521 2 12 2c4.418 0 8 3.582 8 8a8.012 8.012 0 01-2.528 6.382z" />
                    </svg>
                    Share on WhatsApp
                  </button>

                  <div className="pt-3 border-t border-outline-variant">
                    <p className="text-xs text-text-muted text-center">
                      Redirects to {source}. PriceCompare may earn a commission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offers from Other Sellers */}
          {offers.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-text-primary mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Other Offers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.slice(0, 6).map((offer, idx) => (
                  <a
                    key={idx}
                    href={offer.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface border border-outline-variant rounded-xl p-4 hover:border-primary/50 hover:shadow-card-hover transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {offer.image && (
                        <div className="w-16 h-16 rounded-lg bg-surface-dim border border-outline-variant overflow-hidden flex-shrink-0">
                          <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{offer.source}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conditionColors[offer.condition] || "bg-gray-100 text-gray-700"}`}>{offer.condition}</span>
                        </div>
                        <p className="text-sm text-text-primary line-clamp-2">{offer.title}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      <span className="text-sm font-semibold text-primary group-hover:text-primary-dark">View Offer</span>
                      <svg className="w-4 h-4 inline-block ml-1 text-text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Specifications / Description */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-text-primary mb-4">Product Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface border border-outline-variant rounded-xl p-5">
              <div>
                <dt className="text-sm text-text-muted">Category</dt>
                <dd className="text-sm font-medium text-text-primary mt-1">{category || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Condition</dt>
                <dd className="text-sm font-medium text-text-primary mt-1">{condition}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Sold by</dt>
                <dd className="text-sm font-medium text-text-primary mt-1">{source}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Delivery</dt>
                <dd className="text-sm font-medium text-text-primary mt-1">{deliveryEstimate}</dd>
              </div>
              {mrp && (
                <div>
                  <dt className="text-sm text-text-muted">MRP</dt>
                  <dd className="text-sm font-medium text-text-primary mt-1">{formatINR(mrp)}</dd>
                </div>
              )}
              {discount && (
                <div>
                  <dt className="text-sm text-text-muted">Discount</dt>
                  <dd className="text-sm font-medium text-green-600 mt-1">{discount}%</dd>
                </div>
              )}
            </dl>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}