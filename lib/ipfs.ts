export interface TokenMetadataInput {
  name: string;
  symbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

/**
 * Uploads the logo image to IPFS via Pinata (proxied through /api/upload so
 * the Pinata JWT never reaches the browser), then builds and uploads the
 * standard Metaplex-compatible metadata JSON. Returns the metadata URI that
 * gets embedded on-chain.
 */
export async function uploadTokenAssets(
  logo: File,
  meta: TokenMetadataInput
): Promise<{ imageUri: string; metadataUri: string }> {
  const form = new FormData();
  form.append("file", logo);
  form.append("kind", "image");

  const imageRes = await fetch("/api/upload", { method: "POST", body: form });
  if (!imageRes.ok) {
    const err = await safeJson(imageRes);
    throw new Error(err?.error || "Logo upload to IPFS failed");
  }
  const { uri: imageUri } = await imageRes.json();

  const metadataJson = {
    name: meta.name,
    symbol: meta.symbol,
    description: meta.description,
    image: imageUri,
    extensions: {
      website: meta.website || "",
      twitter: meta.twitter || "",
      telegram: meta.telegram || "",
      discord: meta.discord || "",
    },
    properties: {
      files: [{ uri: imageUri, type: logo.type || "image/png" }],
      category: "image",
    },
  };

  const metaRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "json", json: metadataJson }),
  });
  if (!metaRes.ok) {
    const err = await safeJson(metaRes);
    throw new Error(err?.error || "Metadata upload to IPFS failed");
  }
  const { uri: metadataUri } = await metaRes.json();

  return { imageUri, metadataUri };
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
