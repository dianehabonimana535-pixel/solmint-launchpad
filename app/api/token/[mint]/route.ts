import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplTokenMetadata,
  safeFetchMetadata,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as toUmiPublicKey } from "@metaplex-foundation/umi";
import { RPC_ENDPOINT } from "@/lib/network";

export const revalidate = 30;

const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const HOLDER_FETCH_TIMEOUT_MS = 6000;

interface RaydiumPool {
  id: string;
  price: number;
  tvl: number;
  day: { volume: number; priceMin: number; priceMax: number };
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params;

  let mintPubkey: PublicKey;
  try {
    mintPubkey = new PublicKey(mint);
  } catch {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
  }

  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  try {
    const [mintInfo, metadata, poolData, holderCount] = await Promise.all([
      getMint(connection, mintPubkey).catch(() => null),
      (async () => {
        const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());
        const pda = findMetadataPda(umi, { mint: toUmiPublicKey(mint) });
        return safeFetchMetadata(umi, pda).catch(() => null);
      })(),
      fetch(
        `https://api-v3.raydium.io/pools/info/mint?mint1=${mint}&poolType=all&poolSortField=default&sortType=desc&pageSize=10&page=1`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          const pools: RaydiumPool[] = json?.data?.data ?? [];
          if (pools.length === 0) return null;
          return pools.reduce((best, p) => (p.tvl > best.tvl ? p : best), pools[0]);
        })
        .catch(() => null),
      withTimeout(
        connection
          .getProgramAccounts(TOKEN_PROGRAM_ID, {
            filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }],
            dataSlice: { offset: 0, length: 0 },
          })
          .then((accounts) => accounts.length),
        HOLDER_FETCH_TIMEOUT_MS,
        null
      ),
    ]);

    if (!mintInfo) {
      return NextResponse.json({ error: "Token mint not found on-chain" }, { status: 404 });
    }

    let offChainImage: string | null = null;
    let description: string | null = null;
    if (metadata?.uri) {
      try {
        const res = await fetch(metadata.uri, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json();
          offChainImage = json.image ?? null;
          description = json.description ?? null;
        }
      } catch {
        // best effort
      }
    }

    return NextResponse.json({
      mintAddress: mint,
      name: metadata?.name?.trim() || "Unknown Token",
      symbol: metadata?.symbol?.trim() || "?",
      logoUri: offChainImage,
      description,
      supply: mintInfo.supply.toString(),
      decimals: mintInfo.decimals,
      authorities: {
        mintRevoked: mintInfo.mintAuthority === null,
        freezeRevoked: mintInfo.freezeAuthority === null,
        updateRevoked: metadata
          ? metadata.updateAuthority.toString() === SYSTEM_PROGRAM_ID
          : null,
      },
      market: poolData
        ? {
            priceUsd: poolData.price,
            volume24h: poolData.day.volume,
            tvl: poolData.tvl,
            priceMin24h: poolData.day.priceMin,
            priceMax24h: poolData.day.priceMax,
            dexscreenerUrl: `https://dexscreener.com/solana/${mint}`,
          }
        : null,
      holderCount,
      solscanUrl: `https://solscan.io/token/${mint}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
