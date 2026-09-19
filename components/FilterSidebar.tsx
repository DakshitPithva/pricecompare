"use client";

import { useState, useMemo } from "react";

interface FilterSidebarProps {
  results: {
    source: string;
    title: string;
    price: number;
    rating?: number;
    shipping?: string;
  }[];
  onFilter: (filters: {
    brands: string[];
    priceRange: [number, number];
    minRating: number;
    delivery: string[];
  }) => void;
}

export function FilterSidebar({ results, onFilter }: FilterSidebarProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>([]);

  // Extract unique brands from product titles
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    const commonBrands = [
      "Apple", "Samsung", "Sony", "LG", "OnePlus", "Xiaomi", "Realme", "Oppo", "Vivo",
      "Motorola", "Google", "Nothing", "Asus", "Acer", "Dell", "HP", "Lenovo", "MSI",
      "Boat", "Noise", "Boult", "pTron", "Zebronics", "Portronics", "Ambrane",
      "JBL", "Bose", "Sennheiser", "Skullcandy", "Beats", "Anker", "Baseus",
      "Sony", "Canon", "Nikon", "Fujifilm", "GoPro", "DJI", "Logitech", "Razer",
      "Corsair", "SteelSeries", "HyperX", "Redragon", "Cosmic Byte", "Ant Esports",
      "PlayStation", "Xbox", "Nintendo", "Microsoft",
    ];
    
    results.forEach((r) => {
      const title = r.title.toLowerCase();
      commonBrands.forEach((brand) => {
        if (title.includes(brand.toLowerCase())) {
          brandSet.add(brand);
        }
      });
    });
    return Array.from(brandSet).sort();
  }, [results]);

  // Calculate min/max price from results
  const prices = results.map((r) => r.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

  // Extract unique delivery options
  const deliveryOptions = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => {
      if (r.shipping) {
        const shipping = r.shipping.toLowerCase();
        if (shipping.includes("prime")) set.add("Prime");
        if (shipping.includes("free")) set.add("Free Shipping");
        if (shipping.includes("express") || shipping.includes("fast") || shipping.includes("2-day")) set.add("Express");
      }
    });
    return Array.from(set).sort();
  }, [results]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleDeliveryChange = (option: string) => {
    setSelectedDelivery((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  };

  // Apply filters when they change
  useMemo(() => {
    onFilter({
      brands: selectedBrands,
      priceRange,
      minRating,
      delivery: selectedDelivery,
    });
  }, [selectedBrands, priceRange, minRating, selectedDelivery, onFilter]);

  return (
    <aside className="w-full sm:w-72 flex-shrink-0">
      <div className="bg-surface border border-outline-variant rounded-xl p-4 sm:p-5 sticky top-24 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">Filters</h3>
          <button
            onClick={() => {
              setSelectedBrands([]);
              setPriceRange([0, 0]);
              setMinRating(0);
              setSelectedDelivery([]);
            }}
            className="text-xs text-primary hover:underline"
          >
            Clear all
          </button>
        </div>

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-text-primary mb-2">Brand</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-text-secondary">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Price Range
            {priceRange[0] > 0 || priceRange[1] > 0 ? (
              <span className="text-xs text-primary ml-2">
                (₹{priceRange[0].toLocaleString("en-IN")} - ₹{priceRange[1].toLocaleString("en-IN")})
              </span>
            ) : (
              <span className="text-xs text-text-muted ml-2">
                (₹{minPrice.toLocaleString("en-IN")} - ₹{maxPrice.toLocaleString("en-IN")})
              </span>
            )}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[0] || minPrice}
              onChange={(e) => setPriceRange([parseInt(e.target.value, 10), priceRange[1] || maxPrice])}
              className="w-full h-2 bg-outline-variant rounded-lg appearance-none accent-primary"
            />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[1] || maxPrice}
              onChange={(e) => setPriceRange([priceRange[0] || minPrice, parseInt(e.target.value, 10)])}
              className="w-full h-2 bg-outline-variant rounded-lg appearance-none accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>Min: ₹{minPrice.toLocaleString("en-IN")}</span>
              <span>Max: ₹{maxPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Minimum Rating: {minRating > 0 ? `${minRating}+ Stars` : "Any"}
          </label>
          <div className="flex items-center gap-2">
            {[0, 3, 4, 4.5].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  minRating === rating
                    ? "bg-primary text-white"
                    : "bg-surface border border-outline-variant text-text-secondary hover:bg-surface-hover"
                }`}
              >
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating === 0 ? "Any" : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Filter */}
        {deliveryOptions.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-text-primary mb-2">Delivery</label>
            <div className="space-y-1.5">
              {deliveryOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDelivery.includes(option)}
                    onChange={() => handleDeliveryChange(option)}
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-text-secondary">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Count */}
        {(selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] > 0 || minRating > 0 || selectedDelivery.length > 0) && (
          <div className="pt-4 border-t border-outline-variant">
            <p className="text-xs text-text-muted">
              Active filters:{' '}
              <span className="font-medium text-primary">
                {selectedBrands.length + (priceRange[0] > 0 || priceRange[1] > 0 ? 1 : 0) + (minRating > 0 ? 1 : 0) + selectedDelivery.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}