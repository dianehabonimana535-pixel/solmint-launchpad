export interface TokenHistoryEntry {
  name: string;
  symbol: string;
  mintAddress: string;
  signature: string;
  createdAt: string; // ISO date
  imageUri?: string;
}

const STORAGE_KEY = "solmint.history";

export function getHistory(): TokenHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: TokenHistoryEntry): void {
  if (typeof window === "undefined") return;
  const current = getHistory();
  current.unshift(entry);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, 200)));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
