const stats = [
  { value: "0%", label: "Platform fee, always" },
  { value: "~0.01 SOL", label: "Typical total mint cost" },
  { value: "3", label: "Authorities you fully control" },
  { value: "100%", label: "Supply sent to your wallet" },
];

export default function Stats() {
  return (
    <section className="border-y border-border/60 bg-secondary/20">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-3xl font-bold gradient-text sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
