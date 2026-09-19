"use client";

const sources = ["All", "Amazon", "Walmart", "Google Shopping", "eBay"];

const sourceColors: Record<string, string> = {
  Amazon: "bg-amber-500",
  Walmart: "bg-blue-600",
  "Google Shopping": "bg-blue-500",
  eBay: "bg-red-500",
};

interface SourceFilterProps {
  selected: string;
  onSelect: (source: string) => void;
  counts?: Record<string, number>;
}

export default function SourceFilter({ selected, onSelect, counts = {} }: SourceFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      {sources.map((source) => {
        const isActive = selected === source;
        const count = source === "All" ? undefined : counts[source];
        return (
          <button
            key={source}
            onClick={() => onSelect(source)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-text-primary text-white"
                : "bg-surface-dim text-text-secondary hover:bg-surface-container hover:text-text-primary border border-outline-variant"
            }`}
          >
            {source !== "All" && (
              <span className={`w-2 h-2 rounded-full ${sourceColors[source] || "bg-gray-400"}`} />
            )}
            {source}
            {count !== undefined && (
              <span className={`text-xs ${isActive ? "text-white/70" : "text-text-muted"}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
