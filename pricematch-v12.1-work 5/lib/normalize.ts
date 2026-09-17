import type { Product, ProductInput } from "./types";

export function cleanText(v = "") {
  return v.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function extractAmazonAsin(v: string) {
  const m = v.match(/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
  return m?.[1]?.toUpperCase();
}

export function normalizeInput(i: ProductInput): ProductInput {
  const raw = i.url || i.query || "";
  return { ...i, asin: i.asin || extractAmazonAsin(raw), query: i.query || (!i.url ? raw : undefined) };
}

export function productFromInput(i: ProductInput): Product {
  return {
    canonicalId: i.upc ? `upc:${i.upc}` : i.gtin ? `gtin:${i.gtin}` : i.asin ? `asin:${i.asin}` : `query:${cleanText(i.query || i.model || "unknown")}`,
    title: i.query || i.model || i.asin || "Product",
    model: i.model,
    upc: i.upc,
    gtin: i.gtin,
    asin: i.asin,
    matchConfidence: i.upc || i.gtin || i.asin ? 0.99 : 0.55,
  };
}
