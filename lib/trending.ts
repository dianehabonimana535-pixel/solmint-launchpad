export interface TrendingCoin {
  mintAddress: string;
  name: string;
  symbol: string;
  logoUri: string;
  priceUsd: number;
  volume24h: number;
  priceRangePercent: number;
  tvl: number;
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

const RAYDIUM_API =
  "https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=volume24h&sortType=desc&pageSize=20&page=1";

/**
 * Fetches the top trending pools on Raydium, sorted by 24h trading volume.
 * Uses only public, real on-chain data — no manipulation, no paid boosting.
 */
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const res = await fetch(RAYDIUM_API);

  if (!res.ok) {
    throw new Error(`Raydium API error: ${res.status}`);
  }

  const json: RaydiumApiResponse = await res.json();

  if (!json.success || !json.data?.data) {
    throw new Error("Unexpected Raydium API response");
  }

  return json.data.data
    .filter((pool) => pool.mintA && pool.mintB && pool.day)
    .map((pool) => {
      const isMintAKnown =
        pool.mintA.symbol === "SOL" || pool.mintA.symbol === "USDC";
      const token = isMintAKnown ? pool.mintB : pool.mintA;

      const { priceMin, priceMax } = pool.day;
      const priceRangePercent =
        priceMin > 0 ? ((priceMax - priceMin) / priceMin) * 100 : 0;

      return {
        mintAddress: token.address,
        name: token.name,
        symbol: token.symbol,
        logoUri: token.logoURI,
        priceUsd: pool.price,
        volume24h: pool.day.volume,
        priceRangePercent,
        tvl: pool.tvl,
      };
    });
}
