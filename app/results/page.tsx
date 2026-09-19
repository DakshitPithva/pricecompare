"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import PriceCard from "@/components/PriceCard";
import CheapestBanner from "@/components/CheapestBanner";
import SourceFilter from "@/components/SourceFilter";
import { FilterSidebar } from "@/components/FilterSidebar";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import BuyOrWaitButton from "@/components/ai/BuyOrWaitButton";
import ReviewSummaryCard from "@/components/ai/ReviewSummaryCard";
import CompareModal from "@/components/ai/CompareModal";
import SemanticSearch from "@/components/ai/SemanticSearch";
import { SearchResponse } from "@/types";

type SortKey = "price-asc" | "price-desc" | "rating" | "reviews";

interface FilterState {
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  delivery: string[];
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [data, setData] = useState<SearchResponse | null>(null);
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");
  const [showSemantic, setShowSemantic] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    priceRange: [0, 0],
    minRating: 0,
    delivery: [],
  });

  useEffect(() => {
    if (!query) return;
    const ctrl = new AbortController();
    fetch(`/api/search?query=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {});
    return () => ctrl.abort();
  }, [query]);

  const loading = data === null;

  const sourceCounts = useMemo(() => {
    if (!data) return {};
    const counts: Record<string, number> = {};
    data.results.forEach((r) => { counts[r.source] = (counts[r.source] || 0) + 1; });
    return counts;
  }, [data]);

  // Apply all filters
  const filteredResults = useMemo(() => {
    if (!data) return [];
    let results = sourceFilter === "All" ? data.results : data.results.filter((r) => r.source === sourceFilter);

    // Brand filter
    if (filters.brands.length > 0) {
      results = results.filter((r) =>
        filters.brands.some((brand) => r.title.toLowerCase().includes(brand.toLowerCase()))
      );
    }

    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) {
      const [min, max] = filters.priceRange;
      results = results.filter((r) => {
        if (min > 0 && r.price < min) return false;
        if (max > 0 && r.price > max) return false;
        return true;
      });
    }

    // Rating filter
    if (filters.minRating > 0) {
      results = results.filter((r) => (r.rating || 0) >= filters.minRating);
    }

    // Delivery filter
    if (filters.delivery.length > 0) {
      results = results.filter((r) =>
        filters.delivery.some((d) => r.shipping?.toLowerCase().includes(d.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc": return [...results].sort((a, b) => a.price - b.price);
      case "price-desc": return [...results].sort((a, b) => b.price - a.price);
      case "rating": return [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "reviews": return [...results].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      default: return [...results];
    }
  }, [data, sourceFilter, sortBy, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Search Header */}
        <div className="bg-surface border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="mb-3">
              <Logo size="sm" />
            </div>
            <div className="max-w-2xl">
              <SearchBar initialQuery={query} compact />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowSemantic(!showSemantic)}
                className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {showSemantic ? "Hide" : "Need-Based AI Search"}
              </button>
              {filteredResults.length >= 2 && (
                <CompareModal
                  products={filteredResults.slice(0, 4).map((r) => ({
                    title: r.title, price: r.price, source: r.source,
                    image: r.image, link: r.link, description: r.description,
                  }))}
                  query={query}
                />
              )}
            </div>
            {showSemantic && (
              <div className="mt-3 max-w-2xl">
                <SemanticSearch />
              </div>
            )}
            {data && (
              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  {data.results.length} results across {Object.keys(sourceCounts).length} retailers
                </span>
                <span>&bull;</span>
                <span>Updated just now</span>
                <span>&bull;</span>
                <span>All prices in INR</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-[3px] border-outline-variant border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-muted">Comparing prices across 4 sources...</p>
            </div>
          ) : !query ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-text-primary mb-2">Enter a search query</p>
              <p className="text-sm text-text-muted">Type a product name above to compare prices.</p>
            </div>
          ) : !data || data.results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-text-primary mb-2">No results found</p>
              <p className="text-sm text-text-muted">Try a different search query.</p>
            </div>
          ) : (
            <>
              {data.cheapest && (
                <div className="mb-6">
                  <CheapestBanner
                    source={data.cheapest.source}
                    price={data.cheapest.price}
                    currency="INR"
                    savings={filteredResults.length > 1 ? filteredResults[1].price - data.cheapest.price : undefined}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <SourceFilter selected={sourceFilter} onSelect={setSourceFilter} counts={sourceCounts} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="text-sm font-medium text-text-primary bg-surface border border-outline-variant rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="reviews">Most Reviewed</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-5">
                Showing all valid pricing from mock data. Taxes calculated for delivery.
              </p>

              <div className="flex gap-6">
                {/* Filters Sidebar */}
                <FilterSidebar
                  results={data.results}
                  onFilter={setFilters}
                />

                {/* Results Grid */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-3">
                    {filteredResults.map((result, i) => (
                  <div key={`${result.source}-${i}`}>
                    <PriceCard
                      source={result.source}
                      title={result.title}
                      price={result.price}
                      currency={result.currency}
                      image={result.image}
                      link={result.link}
                      rating={result.rating}
                      reviews={result.reviews}
                      isCheapest={result.source === data.cheapest?.source && result.price === data.cheapest?.price}
                      originalPrice={result.originalPrice}
                      description={result.description}
                      shipping={result.shipping}
                      productId={result.productId}
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2 ml-4">
                      <BuyOrWaitButton productName={result.title} currentPrice={result.price} source={result.source} />
                      <ReviewSummaryCard productName={result.title} />
                    </div>
                  </div>
                ))}
              </div>

              {filteredResults.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-text-muted">No results from this source.</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between text-xs text-text-muted bg-surface border border-outline-variant rounded-xl px-5 py-3">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-green" />
                  Multi-Channel Health: {Object.keys(sourceCounts).length} of 4 retailer sources active
                </span>
                <span>All prices auto-converted to INR</span>
              </div>

              {/* Disclaimers */}
              <div className="mt-4 space-y-2 text-xs text-text-muted bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="flex items-center gap-1.5">
                  <span className="text-amber-600">⚠️</span>
                  <strong>Price Disclaimer:</strong> Prices are cached for up to 20 minutes and may not reflect real-time retailer pricing. Always verify the final price on the retailer&apos;s website before purchasing.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-amber-600">🔗</span>
                  <strong>Affiliate Disclosure:</strong> Product links may contain affiliate parameters. PriceCompare may earn a commission from qualifying purchases at no extra cost to you. This does not affect product rankings or recommendations.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-amber-600">📦</span>
                  <strong>Availability:</strong> Product availability, shipping costs, and delivery times vary by retailer and location. Check the retailer&apos;s page for current stock status.
                </p>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-outline-variant border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
