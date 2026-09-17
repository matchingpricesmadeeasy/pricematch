import { cleanText } from "./normalize";
import type { Product, Offer } from "./types";

type Attributes = {
  brand?: string;
  model?: string;
  storageGb?: number;
  ramGb?: number;
  sizeInches?: number;
  color?: string;
  capacityOz?: number;
  packCount?: number;
  condition?: string;
};

function tokens(s: string) {
  return new Set(cleanText(s).split(" ").filter(Boolean));
}

function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit++;
  return hit / Math.max(a.size, b.size);
}

function numberMatch(text: string, patterns: RegExp[]): number | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Number(m[1]);
  }
  return undefined;
}

function attributes(text: string): Attributes {
  const t = cleanText(text);

  const tb = numberMatch(t, [/(\d+(?:\.\d+)?)\s*tb\b/]);
  const gb = numberMatch(t, [/(\d+)\s*gb\b/]);
  const storageGb = tb !== undefined ? tb * 1024 : gb;

  const ramGb = numberMatch(t, [/(\d+)\s*gb\s*ram\b/, /(\d+)\s*gb\s*memory\b/]);
  const sizeInches = numberMatch(t, [/(\d+(?:\.\d+)?)\s*(?:inch|in)\b/]);
  const capacityOz = numberMatch(t, [/(\d+(?:\.\d+)?)\s*oz\b/]);
  const packCount = numberMatch(t, [/(\d+)\s*pack\b/, /pack\s*of\s*(\d+)/]);

  const colors = ["black","white","blue","red","green","silver","gold","gray","grey","purple","pink","beige","brown","navy","midnight","starlight","titanium"];
  const color = colors.find(c => t.includes(c));

  const conditions = ["new","open box","refurbished","renewed","used"];
  const condition = conditions.find(c => t.includes(c));

  return { storageGb, ramGb, sizeInches, color, capacityOz, packCount, condition };
}

function identifierExact(product: Product, offer: Offer) {
  return !!(
    (product.asin && offer.productId?.toUpperCase() === product.asin.toUpperCase()) ||
    (product.upc && offer.productId === product.upc) ||
    (product.gtin && offer.productId === product.gtin)
  );
}

/**
 * A conservative matcher:
 * - Exact identifiers = 1.00
 * - Conflicting variants are rejected
 * - Title similarity is only a fallback
 * - Variant agreement boosts confidence
 */
export function scoreOffer(product: Product, offer: Offer): number {
  if (identifierExact(product, offer)) return 1;

  const pText = cleanText(product.title);
  const oText = cleanText(offer.title);
  const p = tokens(pText);
  const o = tokens(oText);

  const pa = attributes(pText);
  const oa = attributes(oText);

  // Hard reject obvious variant conflicts.
  if (pa.storageGb && oa.storageGb && pa.storageGb !== oa.storageGb) return 0.15;
  if (pa.ramGb && oa.ramGb && pa.ramGb !== oa.ramGb) return 0.15;
  if (pa.sizeInches && oa.sizeInches && pa.sizeInches !== oa.sizeInches) return 0.15;
  if (pa.packCount && oa.packCount && pa.packCount !== oa.packCount) return 0.15;
  if (pa.condition && oa.condition && pa.condition !== oa.condition) return 0.20;

  let score = overlap(p, o) * 0.72;

  if (pa.color && oa.color) score += pa.color === oa.color ? 0.08 : -0.10;
  if (pa.storageGb && oa.storageGb) score += 0.10;
  if (pa.ramGb && oa.ramGb) score += 0.05;
  if (pa.sizeInches && oa.sizeInches) score += 0.08;
  if (pa.packCount && oa.packCount) score += 0.05;
  if (pa.condition && oa.condition) score += 0.05;

  return Math.max(0, Math.min(score, 0.98));
}
