import TrendingCoins from "@/components/TrendingCoins";

export const metadata = {
  title: "Trending — SolMint Launchpad",
  description: "Top Solana tokens by 24h trading volume on Raydium.",
};

export default function TrendingPage() {
  return (
    <main className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Trending on Raydium</h1>
        <p className="mt-2 text-muted-foreground">
          Real on-chain data, sorted by 24h trading volume. No paid boosting, no bots.
        </p>
      </div>
      <TrendingCoins />
    </main>
  );
} 
