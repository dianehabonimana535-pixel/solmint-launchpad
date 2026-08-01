import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/WalletContextProvider";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SolMint Launchpad — Create SPL Meme Coins on Solana, Zero Fees",
  description:
    "Mint your own SPL meme coin on Solana mainnet in minutes. No code, no platform fees — you only ever pay the Solana network directly.",
  metadataBase: new URL("https://solmint.app"),
  openGraph: {
    title: "SolMint Launchpad",
    description: "Create SPL meme coins on Solana mainnet. Zero platform fees, ever.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        <WalletContextProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <div className="press-bed pointer-events-none absolute inset-0 h-[640px]" />
            <div className="bg-grid-glow pointer-events-none absolute inset-0" />
            <div className="relative">
              <Navbar />
              {children}
            </div>
          </div>
          <Toaster theme="dark" position="bottom-right" richColors />
        </WalletContextProvider>
      </body>
    </html>
  );
}
