"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatINR } from "@/lib/normalize";

interface PriceSnapshot {
  price: number;
  checked_at: string;
}

interface PriceChartProps {
  snapshots: PriceSnapshot[];
  currentPrice?: number;
  lowestEver?: number;
  highestEver?: number;
  productTitle?: string;
}

export function PriceChart({ snapshots, currentPrice, lowestEver, highestEver, productTitle }: PriceChartProps) {
  if (!snapshots || snapshots.length < 3) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
        <div className="text-gray-500 text-sm mb-2">📊</div>
        <p className="text-gray-600 font-medium">Price history is still being collected</p>
        <p className="text-gray-400 text-xs mt-1">Check back in a few days for a price trend chart</p>
        {currentPrice && (
          <p className="text-primary-600 font-semibold mt-3">Current: {formatINR(currentPrice)}</p>
        )}
      </div>
    );
  }

  // Process data for chart
  const chartData = snapshots
    .filter((s) => s.price > 0)
    .map((s) => ({
      date: new Date(s.checked_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      fullDate: new Date(s.checked_at).toLocaleString("en-IN"),
      price: s.price,
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  const minPrice = Math.min(...chartData.map((d) => d.price));
  const maxPrice = Math.max(...chartData.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.1 || 100;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {productTitle && <h3 className="font-semibold text-gray-900 mb-4 truncate">{productTitle}</h3>}
      <div className="h-64" style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={11}
              tick={{ fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
              tickLine={false}
              axisLine={false}
              domain={[minPrice - padding, maxPrice + padding]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
            />
            {lowestEver !== undefined && lowestEver !== null && (
              <ReferenceLine
                y={lowestEver}
                stroke="#22c55e"
                strokeDasharray="5 5"
                label={{ value: `Lowest: ${formatINR(lowestEver)}`, position: "right", fill: "#22c55e", fontSize: 10, fontWeight: 600 }}
              />
            )}
            {highestEver !== undefined && highestEver !== null && (
              <ReferenceLine
                y={highestEver}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: `Highest: ${formatINR(highestEver)}`, position: "right", fill: "#ef4444", fontSize: 10, fontWeight: 600 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
        {currentPrice !== undefined && <span className="font-semibold text-primary-600">Current: {formatINR(currentPrice)}</span>}
        {lowestEver !== undefined && lowestEver !== null && <span className="text-green-600">Lowest: {formatINR(lowestEver)}</span>}
        {highestEver !== undefined && highestEver !== null && <span className="text-red-600">Highest: {formatINR(highestEver)}</span>}
      </div>
    </div>
  );
}

interface DealScoreBadgeProps {
  dealScore: number | null | undefined;
  currentPrice?: number;
  avgPrice?: number;
}

export function DealScoreBadge({ dealScore, currentPrice, avgPrice }: DealScoreBadgeProps) {
  if (dealScore === null || dealScore === undefined) {
    return null;
  }

  const isGoodDeal = dealScore > 5;
  const isGreatDeal = dealScore > 15;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
      isGreatDeal ? "bg-green-100 text-green-800" : isGoodDeal ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
    }`}>
      {isGreatDeal && <span className="text-lg">🔥</span>}
      {isGoodDeal && !isGreatDeal && <span className="text-lg">💡</span>}
      <span>
        {dealScore > 0
          ? `${dealScore.toFixed(1)}% below 30-day avg`
          : dealScore < 0
          ? `${Math.abs(dealScore).toFixed(1)}% above 30-day avg`
          : "At 30-day average"}
      </span>
      {avgPrice && currentPrice && (
        <span className="text-xs opacity-75">(Avg: {formatINR(avgPrice)})</span>
      )}
    </div>
  );
}