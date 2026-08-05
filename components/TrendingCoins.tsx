"use client";

import { useEffect, useState } from "react";
import { fetchTrendingCoins, TrendingCoin } from "@/lib/trending";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export default function TrendingCoins() {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingCoins()
      .then(setCoins)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading trending coins…</p>;
  }

  if (error) {
    return <p className="text-center text-red-400 py-8">Error: {error}</p>;
  }

  return (
    <div className="space-y-3">
      {coins.map((coin) => (
        <div
          key={coin.mintAddress}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center gap-3">
            {coin.logoUri && (
              <img
                src={coin.logoUri}
                alt={coin.symbol}
                className="h-10 w-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">{coin.name}</p>
              <p className="text-sm text-gray-400">${coin.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatUsd(coin.priceUsd)}</p>
            <p className="text-sm text-gray-400">
              24h range: {coin.priceRangePercent.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Vol {formatUsd(coin.volume24h)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
