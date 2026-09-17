import type { Offer, Product, SearchResponse } from "./types";
import { db } from "./db";

const retailerKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function persistSearch(response: SearchResponse) {
  if (!response.product) return null;

  const p = response.product;
  const product = await db.product.upsert({
    where: { canonicalId: p.canonicalId },
    create: {
      canonicalId: p.canonicalId,
      title: p.title,
      brand: p.brand,
      model: p.model,
      imageUrl: p.imageUrl,
      attributesJson: p.attributes ? JSON.stringify(p.attributes) : undefined,
    },
    update: {
      title: p.title,
      brand: p.brand,
      model: p.model,
      imageUrl: p.imageUrl,
      attributesJson: p.attributes ? JSON.stringify(p.attributes) : undefined,
    },
  });

  const identifiers = [
    ["upc", p.upc], ["gtin", p.gtin], ["asin", p.asin], ["model", p.model],
  ] as const;
  for (const [type, value] of identifiers) {
    if (!value) continue;
    await db.productIdentifier.upsert({
      where: { type_value: { type, value: String(value).trim().toUpperCase() } },
      create: { type, value: String(value).trim().toUpperCase(), productId: product.id },
      update: { productId: product.id },
    });
  }

  for (const offer of response.offers) await persistOffer(product.id, offer);
  return product;
}

async function persistOffer(productId: string, offer: Offer) {
  const key = retailerKey(offer.retailer);
  const retailer = await db.retailerSource.upsert({
    where: { key },
    create: { key, name: offer.retailer },
    update: { name: offer.retailer },
  });
  const sku = offer.sku || offer.productId || null;
  const existing = sku
    ? await db.offer.findUnique({ where: { productId_retailerId_retailerSku: { productId, retailerId: retailer.id, retailerSku: sku } } })
    : await db.offer.findFirst({ where: { productId, retailerId: retailer.id, retailerSku: null } });

  const data = {
    title: offer.title,
    price: offer.price,
    shipping: offer.shipping,
    currency: offer.currency,
    availability: offer.availability,
    url: offer.url,
    matchConfidence: offer.matchConfidence,
    matchReason: offer.matchReason,
    lastSeenAt: new Date(),
  };
  const saved = existing
    ? await db.offer.update({ where: { id: existing.id }, data })
    : await db.offer.create({ data: { ...data, productId, retailerId: retailer.id, retailerSku: sku } });

  await db.priceSnapshot.create({
    data: {
      offerId: saved.id,
      price: offer.price,
      shipping: offer.shipping,
      total: offer.price + (offer.shipping ?? 0),
      currency: offer.currency,
      availability: offer.availability,
    },
  });
}

export async function getPriceHistory(canonicalId: string, days = 90) {
  const since = new Date(Date.now() - Math.max(1, Math.min(days, 3650)) * 86400000);
  const product = await db.product.findUnique({
    where: { canonicalId },
    include: {
      offers: {
        include: { retailer: true, snapshots: { where: { capturedAt: { gte: since } }, orderBy: { capturedAt: "asc" } } },
        orderBy: { retailerId: "asc" },
      },
    },
  });
  if (!product) return null;
  return {
    canonicalId: product.canonicalId,
    title: product.title,
    offers: product.offers.map(o => ({
      retailer: o.retailer.name,
      url: o.url,
      current: { price: o.price, shipping: o.shipping, total: o.price + (o.shipping ?? 0), currency: o.currency },
      history: o.snapshots.map(s => ({ capturedAt: s.capturedAt, price: s.price, shipping: s.shipping, total: s.total, currency: s.currency })),
    })),
  };
}

export async function attachPersistedOfferIds(response: SearchResponse): Promise<SearchResponse> {
  if (!response.product || !response.offers.length) return response;
  const product = await db.product.findUnique({ where: { canonicalId: response.product.canonicalId }, include: { offers: { include: { retailer: true } } } });
  if (!product) return response;
  const offers = response.offers.map(o => {
    const key = o.sku || o.productId || null;
    const saved = product.offers.find(x => x.retailer.name === o.retailer && (key ? x.retailerSku === key : x.title === o.title));
    return saved ? { ...o, offerId: saved.id } : o;
  });
  return { ...response, offers };
}
