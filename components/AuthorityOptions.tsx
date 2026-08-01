"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lock, Snowflake, PenOff } from "lucide-react";

export interface Authorities {
  revokeMint: boolean;
  revokeFreeze: boolean;
  revokeUpdate: boolean;
}

const items: {
  key: keyof Authorities;
  icon: typeof Lock;
  title: string;
  before: string;
  after: string;
}[] = [
  {
    key: "revokeMint",
    icon: Lock,
    title: "Revoke Mint Authority",
    before: "You (or anyone holding this authority) can mint more tokens later.",
    after: "No one can ever mint more tokens. Total supply is fixed forever.",
  },
  {
    key: "revokeFreeze",
    icon: Snowflake,
    title: "Revoke Freeze Authority",
    before: "The holder of this authority can freeze any wallet's token account.",
    after: "No one can freeze holders. Every wallet keeps full control of its balance.",
  },
  {
    key: "revokeUpdate",
    icon: PenOff,
    title: "Revoke Update Authority",
    before: "The name, symbol, image, and links can still be edited later.",
    after: "Metadata becomes immutable — it can never be changed by anyone.",
  },
];

export default function AuthorityOptions({
  value,
  onChange,
}: {
  value: Authorities;
  onChange: (next: Authorities) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const checked = value[item.key];
        return (
          <div
            key={item.key}
            className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4"
          >
            <Checkbox
              id={item.key}
              checked={checked}
              onCheckedChange={(v) => onChange({ ...value, [item.key]: Boolean(v) })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor={item.key} className="flex items-center gap-2 text-sm font-semibold">
                <item.icon className="h-3.5 w-3.5 text-accent" />
                {item.title}
              </Label>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">If revoked: </span>
                {item.after}
              </p>
              {!checked && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Currently kept: {item.before}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Revoking an authority is permanent and cannot be undone once confirmed on-chain.
      </p>
    </div>
  );
}
