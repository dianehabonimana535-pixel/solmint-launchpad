import { NextResponse } from "next/server";

export const revalidate = 60;

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
  day: { volume: number; priceMin: number; priceMax: number };
}

interface RaydiumApiResponse {
  success: boolean;
  data: { data: RaydiumPool[] };
}

const EXCLUDED_SYMBOLS = new Set([
  "SOL", "WSOL", "USDC", "USDT", "RAY", "ETH", "BTC", "WBTC", "WETH",
  "MSOL", "JITOSOL", "BSOL", "JUP", "PYUSD",
]);

const MIN_VOLUME_USD = 1000;
const MIN_TVL_USD = 500;
const MAX_AGE_HOURS = 48;
const PAGES_TO_SCAN = 20;
const PAGE_SIZE = 100;

function isMemecoinToken(token: RaydiumMint): boolean {
  const symbol = token.symbol.toUpperCase();
  const name = token.name.toLowerCase();
  if (EXCLUDED_SYMBOLS.has(symbol)) return false;
  if (name.includes("xstock")) return false;
  if (name.includes("wrapped")) return false;
  if (symbol.endsWith("USD")) return false;
  return true;
}

async function fetchPage(page: number) {
  const url = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=volume24h&sortType=desc&pageSize=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) return [];
  const json: RaydiumApiResponse = await res.json();
  if (!json.success || !json.data?.data) return [];
  return json.data.data;
}

export async function GET() {
  try {
    const nowSeconds = Date.now() / 1000;
    const cutoffSeconds = nowSeconds - MAX_AGE_HOURS * 3600;

    const pageNumbers = Array.from({ length: PAGES_TO_SCAN }, (_, i) => i + 1);
    const pages = await Promise.all(pageNumbers.map(fetchPage));
    const pools = pages.flat();

    const seen = new Set<string>();
    const coins = [];

    for (const pool of pools) {
      if (!pool.mintA || !pool.mintB || !pool.day) continue;

      const openTime = Number(pool.openTime);
      if (!openTime || openTime < cutoffSeconds) continue;
      if (pool.day.volume < MIN_VOLUME_USD) continue;
      if (pool.tvl < MIN_TVL_USD) continue;

      const isMintAEstablished = EXCLUDED_SYMBOLS.has(pool.mintA.symbol.toUpperCase());
      const token = isMintAEstablished ? pool.mintB : pool.mintA;

      if (!isMemecoinToken(token)) continue;
      if (seen.has(token.address)) continue;
      seen.add(token.address);

      coins.push({
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

    coins.sort((a, b) => b.volume24h - a.volume24h);
    return NextResponse.json(coins.slice(0, 50));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
