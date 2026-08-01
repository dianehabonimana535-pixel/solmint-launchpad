"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Trash2, Coins } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { getHistory, clearHistory, TokenHistoryEntry } from "@/lib/history";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/network";
import { shortenAddress } from "@/lib/utils";

export default function HistoryPage() {
  const [entries, setEntries] = useState<TokenHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setEntries([]);
    toast.success("History cleared on this device");
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Address copied");
  }

  return (
    <main>
      <div className="container py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Your token history</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stored only in this browser — never sent to any server.
            </p>
          </div>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Coins className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tokens created on this device yet.</p>
              <Button asChild variant="gradient">
                <Link href="/create">Create your first token</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <Card key={entry.signature}>
                <CardContent className="space-y-3 pt-6">
                  <div>
                    <p className="font-display font-semibold">{entry.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">${entry.symbol}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => copy(entry.mintAddress)}
                    className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    {shortenAddress(entry.mintAddress, 6)} <Copy className="h-3 w-3" />
                  </button>
                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={explorerAddressUrl(entry.mintAddress)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Token
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={explorerTxUrl(entry.signature)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Tx
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
