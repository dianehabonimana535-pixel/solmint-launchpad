import { Connection, clusterApiUrl } from "@solana/web3.js";

/**
 * Mainnet-beta only. The RPC endpoint can be overridden with a private/paid
 * RPC provider (Helius, QuickNode, Triton, etc) via NEXT_PUBLIC_SOLANA_RPC_URL.
 * The public clusterApiUrl endpoint is rate-limited and NOT recommended for
 * production traffic.
 */
export const SOLANA_NETWORK = "mainnet-beta" as const;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL && process.env.NEXT_PUBLIC_SOLANA_RPC_URL.length > 0
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    : clusterApiUrl(SOLANA_NETWORK);

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}`;
}
