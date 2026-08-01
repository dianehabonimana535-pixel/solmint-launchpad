import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: "IPFS is not configured on the server. Set PINATA_JWT in your environment." },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const incoming = await req.formData();
      const file = incoming.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Logo must be smaller than 5MB" }, { status: 400 });
      }

      const outgoing = new FormData();
      outgoing.append("file", file, file.name);
      outgoing.append(
        "pinataMetadata",
        JSON.stringify({ name: `solmint-logo-${Date.now()}` })
      );

      const pinRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: outgoing,
      });

      if (!pinRes.ok) {
        const text = await pinRes.text();
        return NextResponse.json({ error: `Pinata upload failed: ${text}` }, { status: 502 });
      }

      const data = await pinRes.json();
      const uri = `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`;
      return NextResponse.json({ uri, cid: data.IpfsHash });
    }

    // JSON metadata upload
    const body = await req.json();
    if (body.kind !== "json" || !body.json) {
      return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
    }

    const pinRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataMetadata: { name: `solmint-metadata-${Date.now()}` },
        pinataContent: body.json,
      }),
    });

    if (!pinRes.ok) {
      const text = await pinRes.text();
      return NextResponse.json({ error: `Pinata upload failed: ${text}` }, { status: 502 });
    }

    const data = await pinRes.json();
    const uri = `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`;
    return NextResponse.json({ uri, cid: data.IpfsHash });
  } catch (err) {
    console.error("IPFS upload error", err);
    return NextResponse.json({ error: "Unexpected error during upload" }, { status: 500 });
  }
}
