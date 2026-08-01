"use client";

import { estimateFees } from "@/lib/fees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function FeeEstimator({ revokingAnyAuthority }: { revokingAnyAuthority: boolean }) {
  const fees = estimateFees(revokingAnyAuthority);

  const rows = [
    { label: "Mint account rent", value: fees.mintAccountRentSol },
    { label: "Metadata account rent", value: fees.metadataAccountRentSol },
    { label: "Token account rent", value: fees.tokenAccountRentSol },
    { label: "Network fee (tx 1)", value: fees.networkFeeSol },
    ...(revokingAnyAuthority
      ? [{ label: "Network fee (tx 2 — authorities)", value: fees.extraTxNetworkFeeSol }]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estimated cost</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-mono">{r.value.toFixed(6)} SOL</span>
          </div>
        ))}
        <div className="my-2 h-px bg-border" />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="font-mono gradient-text">{fees.totalSol.toFixed(6)} SOL</span>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          This is a rough estimate of Solana's own rent and network fees. Your wallet shows the
          exact amount before you sign. SolMint Launchpad adds nothing on top.
        </p>
      </CardContent>
    </Card>
  );
}
