"use client";

import { useMemo, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { Upload, Copy, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TokenPreviewCard from "@/components/TokenPreviewCard";
import AuthorityOptions, { Authorities } from "@/components/AuthorityOptions";
import ProgressSteps, { MINT_STEPS } from "@/components/ProgressSteps";
import FeeEstimator from "@/components/FeeEstimator";
import { uploadTokenAssets } from "@/lib/ipfs";
import { createToken, MintStep } from "@/lib/mint";
import { addHistoryEntry } from "@/lib/history";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/network";
import { shortenAddress, cn } from "@/lib/utils";

interface FormState {
  name: string;
  symbol: string;
  description: string;
  decimals: string;
  supply: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  recipient: string;
  creatorAddress: string;
  creatorName: string;
}

const initialForm: FormState = {
  name: "",
  symbol: "",
  description: "",
  decimals: "9",
  supply: "1000000000",
  website: "",
  twitter: "",
  telegram: "",
  discord: "",
  recipient: "",
  creatorAddress: "",
  creatorName: "",
};

const STEP_INDEX: Record<MintStep | "wallet" | "logo" | "metadata", number> = {
  wallet: 0,
  logo: 1,
  metadata: 2,
  building: 3,
  "creating-mint": 3,
  "minting-supply": 4,
  "revoking-authorities": 5,
  confirming: 6,
  complete: 6,
};

type Phase = "idle" | "running" | "success" | "error";

export default function TokenCreatorForm() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [authorities, setAuthorities] = useState<Authorities>({
    revokeMint: true,
    revokeFreeze: true,
    revokeUpdate: false,
  });
  const [customCreatorEnabled, setCustomCreatorEnabled] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [failedIndex, setFailedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ mintAddress: string; signature: string } | null>(null);

  const revokingAny = authorities.revokeMint || authorities.revokeFreeze || authorities.revokeUpdate;

  const errors = useMemo(
    () => validate(form, logoFile, wallet.connected, customCreatorEnabled),
    [form, logoFile, wallet.connected, customCreatorEnabled]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(file: File | null) {
    if (!file) {
      setLogoFile(null);
      setLogoPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    if (!wallet.publicKey || !wallet.connected) {
      toast.error("Connect your wallet first");
      return;
    }

    setPhase("running");
    setFailedIndex(null);
    setErrorMessage(null);
    setCurrentIndex(0);

    const creatorAddress = customCreatorEnabled ? form.creatorAddress.trim() : "";
    const creatorName = customCreatorEnabled ? form.creatorName.trim() : "";

    try {
      setCurrentIndex(STEP_INDEX.logo);
      const { metadataUri } = await uploadTokenAssets(logoFile as File, {
        name: form.name.trim(),
        symbol: form.symbol.trim().toUpperCase(),
        description: form.description.trim(),
        website: form.website.trim(),
        twitter: form.twitter.trim(),
        telegram: form.telegram.trim(),
        discord: form.discord.trim(),
        creatorAddress: creatorAddress || undefined,
        creatorName: creatorName || undefined,
      });
      setCurrentIndex(STEP_INDEX.metadata);

      const recipient = form.recipient.trim() || wallet.publicKey.toBase58();

      const mintResult = await createToken({
        wallet,
        connection,
        name: form.name.trim(),
        symbol: form.symbol.trim().toUpperCase(),
        decimals: Number(form.decimals),
        supply: Number(form.supply),
        metadataUri,
        recipient,
        revokeMint: authorities.revokeMint,
        revokeFreeze: authorities.revokeFreeze,
        revokeUpdate: authorities.revokeUpdate,
        creatorAddress: creatorAddress || undefined,
        onStep: (step) => setCurrentIndex(STEP_INDEX[step]),
      });

      setResult(mintResult);
      setPhase("success");
      setCurrentIndex(MINT_STEPS.length);

      addHistoryEntry({
        name: form.name.trim(),
        symbol: form.symbol.trim().toUpperCase(),
        mintAddress: mintResult.mintAddress,
        signature: mintResult.signature,
        createdAt: new Date().toISOString(),
      });

      toast.success("Token created on Solana mainnet!");
    } catch (err: any) {
      console.error(err);
      setFailedIndex(currentIndex);
      setPhase("error");
      const message = err?.message || "Something went wrong while creating your token";
      setErrorMessage(message);
      toast.error(message);
    }
  }

  function reset() {
    setForm(initialForm);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setCustomCreatorEnabled(false);
    setPhase("idle");
    setCurrentIndex(-1);
    setFailedIndex(null);
    setErrorMessage(null);
    setResult(null);
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  if (phase === "success" && result) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-9 w-9 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold">Your token is live</h2>
            <p className="text-sm text-muted-foreground">
              {form.name} (${form.symbol}) has been minted on Solana mainnet.
            </p>

            <div className="w-full space-y-2 rounded-xl border border-border bg-secondary/30 p-4 text-left">
              <Row label="Token address" value={shortenAddress(result.mintAddress, 6)} onCopy={() => copy(result.mintAddress, "Token address")} />
              <Row label="Transaction" value={shortenAddress(result.signature, 6)} onCopy={() => copy(result.signature, "Signature")} />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <a href={explorerAddressUrl(result.mintAddress)} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> View Token
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={explorerTxUrl(result.signature)} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> View Transaction
                </a>
              </Button>
            </div>

            <Button variant="gradient" className="w-full" onClick={reset}>
              Create another token
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Token details</CardTitle>
            <CardDescription>The basics that will live permanently on-chain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Token name" required>
                <Input placeholder="e.g. Solar Doge" value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={32} />
              </Field>
              <Field label="Symbol" required>
                <Input placeholder="e.g. SDOGE" value={form.symbol} onChange={(e) => update("symbol", e.target.value.toUpperCase())} maxLength={10} />
              </Field>
            </div>

            <Field label="Description" required>
              <Textarea
                placeholder="What is your token about?"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={500}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Decimals" required hint="9 is the Solana standard for meme coins">
                <Input type="number" min={0} max={9} value={form.decimals} onChange={(e) => update("decimals", e.target.value)} />
              </Field>
              <Field label="Initial supply" required>
                <Input type="number" min={1} value={form.supply} onChange={(e) => update("supply", e.target.value)} />
              </Field>
            </div>

            <Field label="Logo" required>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center transition-colors hover:border-primary/60"
              >
                {logoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreviewUrl} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-xs text-muted-foreground">
                  {logoFile ? logoFile.name : "PNG or JPG, square, up to 5MB"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </Field>

            <Field label="Recipient wallet" hint="Defaults to your connected wallet if left blank">
              <Input
                placeholder={wallet.publicKey?.toBase58() || "Connect wallet for default"}
                value={form.recipient}
                onChange={(e) => update("recipient", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="customCreator"
                  checked={customCreatorEnabled}
                  onCheckedChange={(v) => setCustomCreatorEnabled(Boolean(v))}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="customCreator" className="text-base font-semibold">
                    Creator's Info (Optional)
                  </Label>
                  <CardDescription className="mt-1">
                    Change the information of the creator in the metadata. By default, it's
                    your connected wallet.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          {customCreatorEnabled && (
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Creator's Address" required hint="Won't be marked verified — it hasn't signed this transaction">
                <Input
                  placeholder="Ex: 3stNIYCJd..."
                  value={form.creatorAddress}
                  onChange={(e) => update("creatorAddress", e.target.value)}
                />
              </Field>
              <Field label="Creator's Name" required>
                <Input
                  placeholder="Ex: John Doe"
                  value={form.creatorName}
                  onChange={(e) => update("creatorName", e.target.value)}
                  maxLength={64}
                />
              </Field>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
            <CardDescription>Optional — shown in your token metadata.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Website"><Input placeholder="https://..." value={form.website} onChange={(e) => update("website", e.target.value)} /></Field>
            <Field label="Twitter / X"><Input placeholder="https://x.com/..." value={form.twitter} onChange={(e) => update("twitter", e.target.value)} /></Field>
            <Field label="Telegram"><Input placeholder="https://t.me/..." value={form.telegram} onChange={(e) => update("telegram", e.target.value)} /></Field>
            <Field label="Discord"><Input placeholder="https://discord.gg/..." value={form.discord} onChange={(e) => update("discord", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token authorities</CardTitle>
            <CardDescription>Choose what to permanently give up for holder trust.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthorityOptions value={authorities} onChange={setAuthorities} />
          </CardContent>
        </Card>

        {phase === "running" && (
          <Card>
            <CardHeader>
              <CardTitle>Creating your token…</CardTitle>
              <CardDescription>Approve each transaction in your wallet when prompted.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressSteps steps={MINT_STEPS} currentIndex={currentIndex} failedIndex={failedIndex} />
            </CardContent>
          </Card>
        )}

        {phase === "error" && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <ProgressSteps steps={MINT_STEPS} currentIndex={currentIndex} failedIndex={failedIndex} />
              <Button variant="outline" onClick={handleSubmit}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <Button
          size="lg"
          variant="gradient"
          className="w-full"
          disabled={phase === "running" || !wallet.connected}
          onClick={handleSubmit}
        >
          {!wallet.connected ? "Connect wallet to continue" : phase === "running" ? "Creating token…" : "Create token on mainnet"}
        </Button>
        {errors.length > 0 && wallet.connected && (
          <p className="text-center text-xs text-muted-foreground">{errors[0]}</p>
        )}
      </div>

      <div className="space-y-6">
        <TokenPreviewCard
          name={form.name}
          symbol={form.symbol}
          description={form.description}
          logoPreviewUrl={logoPreviewUrl}
          supply={form.supply}
          decimals={form.decimals}
          website={form.website}
          twitter={form.twitter}
          telegram={form.telegram}
          discord={form.discord}
        />
        <FeeEstimator revokingAnyAuthority={revokingAny} />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button onClick={onCopy} className="flex items-center gap-1.5 font-mono text-xs">
        {value}
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

function validate(
  form: FormState,
  logoFile: File | null,
  connected: boolean,
  customCreatorEnabled: boolean
): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Token name is required");
  if (form.name.length > 32) errors.push("Token name must be 32 characters or fewer");
  if (!form.symbol.trim()) errors.push("Symbol is required");
  if (form.symbol.length > 10) errors.push("Symbol must be 10 characters or fewer");
  if (!form.description.trim()) errors.push("Description is required");
  if (!logoFile) errors.push("Logo image is required");

  const decimals = Number(form.decimals);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 9) {
    errors.push("Decimals must be a whole number between 0 and 9");
  }

  const supply = Number(form.supply);
  if (!Number.isFinite(supply) || supply <= 0) {
    errors.push("Initial supply must be greater than 0");
  }

  if (form.recipient.trim()) {
    try {
      // eslint-disable-next-line no-new
      new PublicKey(form.recipient.trim());
    } catch {
      errors.push("Recipient wallet address is not a valid Solana address");
    }
  }

  if (customCreatorEnabled) {
    if (!form.creatorAddress.trim()) {
      errors.push("Creator's address is required when Creator's Info is enabled");
    } else {
      try {
        // eslint-disable-next-line no-new
        new PublicKey(form.creatorAddress.trim());
      } catch {
        errors.push("Creator's address is not a valid Solana address");
      }
    }
    if (!form.creatorName.trim()) {
      errors.push("Creator's name is required when Creator's Info is enabled");
    }
  }

  for (const [label, url] of [
    ["Website", form.website],
    ["Twitter", form.twitter],
    ["Telegram", form.telegram],
    ["Discord", form.discord],
  ] as const) {
    if (url && !/^https?:\/\//i.test(url)) {
      errors.push(`${label} link must start with http:// or https://`);
    }
  }

  return errors;
}
