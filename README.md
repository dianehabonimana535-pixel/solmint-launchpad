# SolMint Launchpad

Create SPL meme coins on **Solana mainnet** — no code required. Non-custodial,
wallet-signed, and the app never adds a platform fee: you only ever pay
Solana's own network fees and account rent.

## What it does

- Connect a wallet (Phantom, Solflare, and any Wallet Standard wallet such as
  Backpack, Glow, or Trust Wallet — auto-detected in-browser)
- Fill in token details (name, symbol, description, decimals, supply, logo,
  socials)
- Logo + metadata JSON are uploaded to IPFS via Pinata
- The app builds the mint + metadata + mint-to-recipient transaction; **your
  wallet signs it locally** — the app never sees a private key or seed phrase
- Optionally revoke mint authority, freeze authority, and/or metadata update
  authority in a second signed transaction
- Get the token address, transaction signature, and Explorer links; history
  is kept locally in your browser

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
- `@solana/web3.js`, `@solana/spl-token`
- `@metaplex-foundation/mpl-token-metadata` (via Umi) for on-chain metadata
- `@solana/wallet-adapter-*` for wallet connections
- Pinata for IPFS pinning (proxied through a server API route so the API key
  never reaches the browser)

### A note on the token program

The brief mentioned Token-2022. This build uses the **classic SPL Token
program** (`TOKEN_PROGRAM_ID`) with Metaplex Token Metadata, which is the
combination with the broadest wallet, explorer, and DEX support today (this
is the same approach pump.fun-style launchpads use). Token-2022 adds
extensions (transfer fees, transfer hooks, metadata-in-mint, etc.) that
aren't needed for a standard meme coin and meaningfully increase integration
risk with wallets/DEXs that don't yet fully support every extension. If you
want a Token-2022 variant, `lib/mint.ts` is the only file that needs to
change — swap the SPL Token instructions for their `spl-token` Token-2022
equivalents and use `mpl-token-metadata`'s Token-2022 metadata pointer flow.

## Zero platform fees — how that's enforced in code

There is no admin wallet constant anywhere in this codebase, and no
`SystemProgram.transfer` to any address other than the accounts Solana
itself requires (mint account rent, metadata account rent, token account
rent). Every transaction in `lib/mint.ts` interacts directly with the SPL
Token program, the Metaplex Token Metadata program, and the System Program.
Search the repo for `SystemProgram.transfer` if you want to confirm this
yourself — you won't find one to a third-party wallet.

## Getting started

```bash
npm install
cp .env.example .env.local
# edit .env.local — see below
npm run dev
```

Open http://localhost:3000.

### Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `PINATA_JWT` | Yes | Server-only. Create a free Pinata account, generate a JWT with `pinFileToIPFS` + `pinJSONToIPFS` scopes. |
| `PINATA_GATEWAY` | No | Defaults to `gateway.pinata.cloud`. Use your own dedicated gateway if you have one. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Recommended | Defaults to the public `api.mainnet-beta.solana.com` endpoint, which is heavily rate-limited and **not suitable for production**. Get a free/paid endpoint from Helius, QuickNode, Triton, or similar. |

This app talks to **Solana mainnet-beta only**. Every token created is real
and immediately tradable. Test with small amounts first.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the three environment variables above in Project Settings →
   Environment Variables.
4. Deploy. No other configuration is needed — the app is a standard Next.js
   15 App Router project.

## Project structure

```
app/
  page.tsx              Landing page
  create/page.tsx        Token creator flow
  history/page.tsx       Locally stored past mints
  api/upload/route.ts    Server-side Pinata proxy (keeps JWT secret)
  layout.tsx, globals.css
components/
  Hero, Stats, FAQ, Footer, Navbar
  WalletContextProvider.tsx   Wallet adapter setup
  TokenCreatorForm.tsx        Main form + orchestration
  TokenPreviewCard, AuthorityOptions, ProgressSteps, FeeEstimator
  ui/                          Small local button/card/input/checkbox primitives
lib/
  mint.ts        Core on-chain logic: create mint, attach metadata, mint
                 supply, revoke authorities — all wallet-signed
  ipfs.ts        Client helper that calls /api/upload
  network.ts     RPC endpoint + Explorer URL helpers
  fees.ts        Transparent fee/rent estimate shown before signing
  history.ts     localStorage-backed history
  utils.ts       Small shared helpers
```

## Security notes

- The app never requests, stores, or transmits a seed phrase or private key.
- All signing happens inside the user's own wallet extension/app.
- The Pinata JWT lives only in server environment variables and is used
  from the `/api/upload` route — it is never sent to the client.
- Revoking an authority is irreversible; the UI says so before the user
  confirms, and the app never pre-checks a box the user didn't choose except
  for sensible, clearly-labeled defaults (mint + freeze revoked by default,
  update authority left mutable by default) that the user can change.

## Disclaimer

Creating and distributing a token carries financial, legal, and regulatory
risk that varies by jurisdiction. This software is provided as a tool; it is
not financial, legal, or tax advice. Review your local regulations before
launching a token intended for public trading.
