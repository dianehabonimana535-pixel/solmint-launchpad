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

interface RaydiumMint {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
}

interface RaydiumPool {
  id: string;
  mintA: RaydiumMint;
  mintB: RaydiumMint;
  price: number;
  tvl: number;
  openTime: string;
  day: {
    volume: number;
    priceMin: number;
    priceMax: number;
  };
}

interface RaydiumApiResponse {
  success: boolean;
  data: {
    data: RaydiumPool[];
  };
}

const EXCLUDED_SYMBOLS = new Set([
  "SOL", "WSOL", "USDC", "USDT", "RAY", "ETH", "BTC", "WBTC", "WETH",
  "MSOL", "JITOSOL", "BSOL", "JUP", "PYUSD",
]);

function isMemecoinToken(token: RaydiumMint): boolean {
  if (EXCLUDED_SYMBOLS.has(token.symbol.toUpperCase())) return false;
  if (token.name.toLowerCase().includes("xstock")) return false;
  if (token.name.toLowerCase().includes("wrapped")) return false;
  return true;
}

async function fetchPage(page: number): Promise<RaydiumPool[]> {
  const res = await fetch(
    `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=100&page=${page}`
  );
  if (!res.ok) throw new Error(`Raydium API error: ${res.status}`);
  const json: RaydiumApiResponse = await res.json();
  if (!json.success || !json.data?.data) {
    throw new Error("Unexpected Raydium API response");
  }
  return json.data.data;
}

/**
 * Fetches trending Solana memecoins launched within the last 48h,
 * ranked by real 24h trading volume on Raydium.
 * Excludes major/established assets (SOL, stablecoins, wrapped tokens, tokenized stocks).
 *
 * Strategy: pools are fetched newest-first so we don't have to scan the
 * entire pool history to find recent launches, then results are ranked
 * by volume so only the ones that actually performed well surface.
 */
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const nowSeconds = Date.now() / 1000;
  const cutoffSeconds = nowSeconds - 48 * 3600;

  const seen = new Set<string>();
  const candidates: TrendingCoin[] = [];

  let page = 1;
  let consecutiveTooOldPages = 0;

  while (page <= 25 && consecutiveTooOldPages < 2) {
    const pools = await fetchPage(page);
    if (pools.length === 0) break;

    let sawRecentInThisPage = false;

    for (const pool of pools) {
      if (!pool.mintA || !pool.mintB || !pool.day) continue;

      const openTime = Number(pool.openTime);
      if (!openTime || openTime < cutoffSeconds) continue;

      sawRecentInThisPage = true;

      const isMintAEstablished =
        EXCLUDED_SYMBOLS.has(pool.mintA.symbol.toUpperCase());
      const token = isMintAEstablished ? pool.mintB : pool.mintA;

      if (!isMemecoinToken(token)) continue;
      if (seen.has(token.address)) continue;
      seen.add(token.address);

      candidates.push({
        mintAddress: token.address,
        poolId: pool.id,
        name: token.name,
        symbol: token.symbol,
        logoUri: token.logoURI,
        priceUsd: pool.price,
        volume24h: pool.day.volume,
        tvl: pool.tvl,
        ageHours: (nowSeconds - openTime) / 3600,
        priceMin: pool.day.priceMin,
        priceMax: pool.day.priceMax,
        dexscreenerUrl: `https://dexscreener.com/solana/${token.address}`,
        solscanUrl: `https://solscan.io/token/${token.address}`,
      });
    }

    consecutiveTooOldPages = sawRecentInThisPage ? 0 : consecutiveTooOldPages + 1;
    page++;
  }

  return candidates.sort((a, b) => b.volume24h - a.volume24h).slice(0, 50);
}
