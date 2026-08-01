"use client";

import Image from "next/image";
import { Coins, Globe, Twitter, Send, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TokenPreviewCard({
  name,
  symbol,
  description,
  logoPreviewUrl,
  supply,
  decimals,
  website,
  twitter,
  telegram,
  discord,
}: {
  name: string;
  symbol: string;
  description: string;
  logoPreviewUrl: string | null;
  supply: string;
  decimals: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}) {
  const links = [
    { icon: Globe, value: website },
    { icon: Twitter, value: twitter },
    { icon: Send, value: telegram },
    { icon: MessageCircle, value: discord },
  ].filter((l) => l.value);

  return (
    <Card className="sticky top-24 overflow-hidden">
      <div className="animated-gradient h-20 w-full opacity-80" />
      <div className="-mt-10 flex flex-col items-center px-6 pb-6">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-secondary shadow-lg">
          {logoPreviewUrl ? (
            <Image src={logoPreviewUrl} alt="Token logo" width={80} height={80} className="h-full w-full object-cover" unoptimized />
          ) : (
            <Coins className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <h3 className="mt-3 font-display text-lg font-bold">{name || "Your Token Name"}</h3>
        <p className="text-sm font-mono text-muted-foreground">${symbol || "SYMBOL"}</p>

        <p className="mt-3 line-clamp-3 text-center text-xs text-muted-foreground">
          {description || "A short description of your token will appear here."}
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-secondary/60 py-2">
            <p className="text-[10px] uppercase text-muted-foreground">Supply</p>
            <p className="text-sm font-semibold font-mono">{supply || "0"}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 py-2">
            <p className="text-[10px] uppercase text-muted-foreground">Decimals</p>
            <p className="text-sm font-semibold font-mono">{decimals || "0"}</p>
          </div>
        </div>

        {links.length > 0 && (
          <div className="mt-4 flex gap-2">
            {links.map((l, i) => (
              <span
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground"
              >
                <l.icon className="h-3.5 w-3.5" />
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
