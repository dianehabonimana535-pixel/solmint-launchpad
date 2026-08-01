import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  AuthorityType,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createV1,
  mintV1,
  updateV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  publicKey as toUmiPublicKey,
  none,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import bs58 from "bs58";
import { RPC_ENDPOINT } from "./network";

export interface CreateTokenParams {
  wallet: WalletContextState;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  metadataUri: string;
  recipient: string; // wallet that receives the minted supply
  revokeMint: boolean;
  revokeFreeze: boolean;
  revokeUpdate: boolean;
  onStep?: (step: MintStep) => void;
}

export type MintStep =
  | "building"
  | "creating-mint"
  | "minting-supply"
  | "revoking-authorities"
  | "confirming"
  | "complete";

export interface CreateTokenResult {
  mintAddress: string;
  signature: string;
}

/**
 * Creates a new SPL token, attaches Metaplex metadata, mints the full
 * supply to the recipient wallet, and optionally revokes mint / freeze /
 * update authorities — all in a small number of wallet-signed transactions.
 *
 * Every instruction here is signed locally by the connected wallet
 * (Phantom, Solflare, Backpack, Glow...). This app never sees, requests,
 * or stores a seed phrase or private key, and never inserts a fee-transfer
 * instruction to any platform wallet.
 */
export async function createToken(params: CreateTokenParams): Promise<CreateTokenResult> {
  const {
    wallet,
    name,
    symbol,
    decimals,
    supply,
    metadataUri,
    recipient,
    revokeMint,
    revokeFreeze,
    revokeUpdate,
    onStep,
  } = params;

  if (!wallet.publicKey || !wallet.signAllTransactions) {
    throw new Error("Wallet not connected");
  }

  const recipientPubkey = new PublicKey(recipient);

  const umi = createUmi(RPC_ENDPOINT).use(walletAdapterIdentity(wallet)).use(mplTokenMetadata());

  const mintSigner = generateSigner(umi);
  const authority = umi.identity; // the connected wallet acts as mint/freeze/update authority

  onStep?.("building");

  // 1) Create the mint account + initialize it + create on-chain metadata,
  //    then mint the full initial supply straight to the recipient's ATA.
  let builder = transactionBuilder()
    .add(
      createV1(umi, {
        mint: mintSigner,
        authority,
        name,
        symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals,
        tokenStandard: TokenStandard.Fungible,
      })
    )
    .add(
      mintV1(umi, {
        mint: mintSigner.publicKey,
        authority,
        amount: BigInt(Math.round(supply * 10 ** decimals)),
        tokenOwner: toUmiPublicKey(recipientPubkey.toBase58()),
        tokenStandard: TokenStandard.Fungible,
      })
    );

  onStep?.("creating-mint");
  const { signature: createSig } = await builder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  onStep?.("minting-supply");

  const mintAddress = mintSigner.publicKey.toString();
  const mintPubkeyWeb3 = new PublicKey(mintAddress);

  // 2) Optionally revoke authorities in a second transaction.
  const revokeAny = revokeMint || revokeFreeze || revokeUpdate;
  let finalSig = bs58EncodeSignature(createSig);

  if (revokeAny) {
    onStep?.("revoking-authorities");
    let revokeBuilder = transactionBuilder();

    if (revokeUpdate) {
      // Immutable metadata: strip the ability to further edit name/symbol/uri.
      revokeBuilder = revokeBuilder.add(
        updateV1(umi, {
          mint: mintSigner.publicKey,
          authority,
          data: none(),
          newUpdateAuthority: none(),
          primarySaleHappened: none(),
          isMutable: false,
        })
      );
    }

    if (revokeMint) {
      const ix = createSetAuthorityInstruction(
        mintPubkeyWeb3,
        wallet.publicKey,
        AuthorityType.MintTokens,
        null
      );
      revokeBuilder = revokeBuilder.add({
        instruction: fromWeb3JsInstruction(ix),
        signers: [authority],
        bytesCreatedOnChain: 0,
      });
    }

    if (revokeFreeze) {
      const ix = createSetAuthorityInstruction(
        mintPubkeyWeb3,
        wallet.publicKey,
        AuthorityType.FreezeAccount,
        null
      );
      revokeBuilder = revokeBuilder.add({
        instruction: fromWeb3JsInstruction(ix),
        signers: [authority],
        bytesCreatedOnChain: 0,
      });
    }

    const { signature: revokeSig } = await revokeBuilder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });
    finalSig = bs58EncodeSignature(revokeSig);
  }

  onStep?.("confirming");
  onStep?.("complete");

  return { mintAddress, signature: finalSig };
}

function bs58EncodeSignature(sig: Uint8Array): string {
  return bs58.encode(sig);
}
}
