"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
  compact?: boolean;
}

const trendingQueries = [
  "iPhone 15 Pro 128GB",
  "Sony WH-1000XM5",
  "PlayStation 5 Slim",
  "MacBook Air M3",
  "Nintendo Switch OLED",
  "Dyson Airwrap Styler",
];

export default function SearchBar({ initialQuery = "", compact = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/results?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleTrendingClick = (q: string) => {
    setQuery(q);
    router.push(`/results?q=${encodeURIComponent(q)}`);
    setShowSuggestions(false);
  };

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setShowSuggestions(false);
      }
    } catch {
      setShowSuggestions(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        setQuery(selected);
        router.push(`/results?q=${encodeURIComponent(selected)}`);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/results?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Delay hiding to allow click events to fire
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-surface rounded-xl border border-outline-variant shadow-card transition-shadow hover:shadow-card-hover ${compact ? "p-1" : "p-1.5"}`}>
          <div className="pl-4 text-text-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder="Search any product to compare prices..."
            className={`flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted ${compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"}`}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setShowSuggestions(false); }}
              className="p-2 text-text-muted hover:text-text-secondary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className={`bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors ${compact ? "px-5 py-2 text-sm" : "px-6 py-3 text-base"}`}
          >
            Compare Prices
            <svg className="w-4 h-4 inline-block ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                    index === selectedIndex ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </form>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Trending:</span>
          {trendingQueries.map((q) => (
            <button
              key={q}
              onClick={() => handleTrendingClick(q)}
              className="text-sm text-text-secondary hover:text-primary bg-surface hover:bg-surface-container-low border border-outline-variant rounded-full px-3 py-1 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}