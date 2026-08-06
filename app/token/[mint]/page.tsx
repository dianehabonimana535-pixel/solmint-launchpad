"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface TokenDashboardData {
  mintAddress: string;
  name: string;
  symbol: string;
  logoUri: string | null;
  description: string | null;
  supply: string;
  decimals: number;
  authorities: {
    mintRevoked: boolean;
    freezeRevoked: boolean;
    updateRevoked: boolean | null;
  };
  market: {
    priceUsd: number;
    volume24h: number;
    tvl: number;
    priceMin24h: number;
    priceMax24h: number;
    dexscreenerUrl: string;
  } | null;
  holderCount: number | null;
  solscanUrl: string;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(4)}`;
}

function formatSupply(supply: string, decimals: number): string {
  const value = Number(BigInt(supply)) / 10 ** decimals;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
}

function AuthorityRow({ label, revoked }: { label: string; revoked: boolean | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
      <span className="text-sm">{label}</span>
      {revoked === null ? (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <HelpCircle className="h-3.5 w-3.5" /> N/A
        </span>
      ) : revoked ? (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Revoked
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <XCircle className="h-3.5 w-3.5" /> Active
        </span>
      )}
    </div>
  );
}

export default function TokenDashboardPage() {
  const params = useParams();
  const mint = params.mint as string;

  const [data, setData] = useState<TokenDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mint) return;
    fetch(`/api/token/${mint}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mint]);

  if (loading) {
    return <p className="container py-10 text-center text-gray-400">Loading token dashboard…</p>;
  }

  if (error || !data) {
    return <p className="container py-10 text-center text-red-400">Error: {error}</p>;
  }

  return (
    <main className="container max-w-2xl py-10">
      <div className="mb-6 flex items-center gap-4">
        {data.logoUri && (
          <img src={data.logoUri} alt={data.symbol} className="h-16 w-16 rounded-full" />
        )}
        <div>
          <h1 className="font-display text-2xl font-bold">{data.name}</h1>
          <p className="text-muted-foreground">${data.symbol}</p>
        </div>
      </div>

      {data.description && (
        <p className="mb-6 text-sm text-muted-foreground">{data.description}</p>
      )}

      <p className="mb-6 break-all rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
        {data.mintAddress}
      </p>

      {data.market ? (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-lg font-semibold">{formatUsd(data.market.priceUsd)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-500">24h Volume</p>
            <p className="text-lg font-semibold">{formatUsd(data.market.volume24h)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-500">Liquidity (TVL)</p>
            <p className="text-lg font-semibold">{formatUsd(data.market.tvl)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-500">24h Range</p>
            <p className="text-lg font-semibold">
              {formatUsd(data.market.priceMin24h)} – {formatUsd(data.market.priceMax24h)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
          No active Raydium pool found for this token yet.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-500">Total Supply</p>
          <p className="text-lg font-semibold">{formatSupply(data.supply, data.decimals)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-500">Holders</p>
          <p className="text-lg font-semibold">
            {data.holderCount === null ? "Unavailable" : data.holderCount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 font-semibold">Token Authorities</h2>
        <div className="space-y-2">
          <AuthorityRow label="Mint Authority" revoked={data.authorities.mintRevoked} />
          <AuthorityRow label="Freeze Authority" revoked={data.authorities.freezeRevoked} />
          <AuthorityRow label="Update Authority" revoked={data.authorities.updateRevoked} />
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={data.solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Solscan <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {data.market && (
          <a
            href={data.market.dexscreenerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-purple-600/20 px-4 py-2 text-sm text-purple-300 hover:bg-purple-600/30"
          >
            DexScreener <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </main>
  );
}
