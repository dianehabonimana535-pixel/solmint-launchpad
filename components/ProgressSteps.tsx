"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  key: string;
  label: string;
}

export const MINT_STEPS: Step[] = [
  { key: "wallet", label: "Connect Wallet" },
  { key: "logo", label: "Upload Logo" },
  { key: "metadata", label: "Upload Metadata" },
  { key: "mint", label: "Create Mint" },
  { key: "supply", label: "Mint Supply" },
  { key: "authorities", label: "Revoke Authorities" },
  { key: "complete", label: "Complete" },
];

export default function ProgressSteps({
  steps,
  currentIndex,
  failedIndex,
}: {
  steps: Step[];
  currentIndex: number; // index of the step currently in progress, -1 if not started
  failedIndex?: number | null;
}) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isDone = currentIndex > i && failedIndex !== i;
        const isActive = currentIndex === i;
        const isFailed = failedIndex === i;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isDone && "border-accent bg-accent text-accent-foreground",
                  isActive && !isFailed && "border-primary bg-primary/20 text-primary",
                  isFailed && "border-destructive bg-destructive/20 text-destructive",
                  !isDone && !isActive && !isFailed && "border-border text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive && !isFailed ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-px flex-1 min-h-[18px]", isDone ? "bg-accent" : "bg-border")} />
              )}
            </div>
            <div className="pb-5 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-foreground",
                  isDone && "text-foreground",
                  !isActive && !isDone && "text-muted-foreground",
                  isFailed && "text-destructive"
                )}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
