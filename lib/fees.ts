/**
 * Rough, transparent estimate of what the user will pay Solana itself.
 * These are approximations shown before signing; the wallet always shows
 * the exact, final fee at signature time. SolMint Launchpad adds nothing
 * on top of these numbers — no service fee, no commission, ever.
 */
export interface FeeEstimate {
  mintAccountRentSol: number;
  metadataAccountRentSol: number;
  tokenAccountRentSol: number;
  networkFeeSol: number;
  extraTxNetworkFeeSol: number; // second tx if revoking authorities
  totalSol: number;
}

const MINT_ACCOUNT_RENT = 0.00203928; // ~82 bytes SPL Mint account
const METADATA_ACCOUNT_RENT = 0.00561672; // Metaplex metadata account (~679 bytes)
const TOKEN_ACCOUNT_RENT = 0.00203928; // Associated token account
const BASE_NETWORK_FEE = 0.000015; // ~3 signatures x 5000 lamports, rounded up
const EXTRA_TX_FEE = 0.000005; // second transaction for authority revokes

export function estimateFees(revokingAnyAuthority: boolean): FeeEstimate {
  const extraTxNetworkFeeSol = revokingAnyAuthority ? EXTRA_TX_FEE : 0;
  const totalSol =
    MINT_ACCOUNT_RENT +
    METADATA_ACCOUNT_RENT +
    TOKEN_ACCOUNT_RENT +
    BASE_NETWORK_FEE +
    extraTxNetworkFeeSol;

  return {
    mintAccountRentSol: MINT_ACCOUNT_RENT,
    metadataAccountRentSol: METADATA_ACCOUNT_RENT,
    tokenAccountRentSol: TOKEN_ACCOUNT_RENT,
    networkFeeSol: BASE_NETWORK_FEE,
    extraTxNetworkFeeSol,
    totalSol,
  };
}
