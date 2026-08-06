export interface TrendingCoin {
  mintAddress: string;
  poolId: string;
  name: string;
  symbol: string;
  logoUri: string;
  priceUsd: number;
  volume24h: number;
  tvl: number;
  ageHours: number;
  priceMin: number;
  priceMax: number;
  dexscreenerUrl: string;
  solscanUrl: string;
}

/**
 * Fetches trending Solana memecoins launched within the last 48h,
 * ranked by real 24h trading volume on Raydium. The heavy scanning
 * happens server-side (app/api/trending/route.ts) so the phone only
 * downloads the final, ready-to-display list.
 */
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const res = await fetch("/api/trending");
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Trending API error: ${res.status}`);
  }
  return res.json();
}
