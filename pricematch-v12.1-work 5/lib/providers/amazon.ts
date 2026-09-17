import type { RetailerProvider } from "./types";
import type { ProductInput, Offer } from "../types";
import { fetchWithTimeout } from "../http";

const API_BASE = "https://creatorsapi.amazon";
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken() {
  const id = process.env.AMAZON_CLIENT_ID;
  const secret = process.env.AMAZON_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const r = await fetchWithTimeout("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: id, client_secret: secret, scope: "creatorsapi::default" }),
    cache: "no-store",
  }, 8000);
  if (!r.ok) throw new Error(`Amazon token endpoint returned ${r.status}`);
  const data = await r.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Amazon token response did not contain an access token");
  tokenCache = { token: data.access_token, expiresAt: Date.now() + Math.max(60, Number(data.expires_in || 3600)) * 1000 };
  return data.access_token;
}

function first<T>(...values: T[]) { return values.find(v => v !== undefined && v !== null); }
function titleOf(item: any) { return first(item?.itemInfo?.title?.displayValue, item?.itemInfo?.title?.value, item?.title) || "Amazon product"; }
function priceOf(item: any) {
  const listing = item?.offersV2?.listings?.[0];
  return Number(first(listing?.price?.money?.amount, listing?.price?.amount, item?.offersV2?.listings?.[0]?.price?.amount));
}

async function call(path: string, token: string, body: Record<string, unknown>) {
  const marketplace = process.env.AMAZON_MARKETPLACE || "www.amazon.com";
  const r = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-marketplace": marketplace },
    body: JSON.stringify(body),
    cache: "no-store",
  }, 9000);
  if (!r.ok) throw new Error(`Amazon Creators API returned ${r.status}`);
  return r.json();
}

export const amazonProvider: RetailerProvider = {
  name: "Amazon",
  async search(i: ProductInput) {
    if (!process.env.AMAZON_CLIENT_ID || !process.env.AMAZON_CLIENT_SECRET || !process.env.AMAZON_PARTNER_TAG) {
      return { provider: "Amazon", offers: [], warning: "Amazon Creators API credentials are not configured." };
    }
    try {
      const token = await getToken();
      if (!token) return { provider: "Amazon", offers: [] };
      const marketplace = process.env.AMAZON_MARKETPLACE || "www.amazon.com";
      const resources = ["itemInfo.title", "itemInfo.byLineInfo", "offersV2.listings.price", "offersV2.listings.availability", "offersV2.listings.condition"];
      const base = { partnerTag: process.env.AMAZON_PARTNER_TAG, partnerType: "Associates", marketplace, resources };
      const data = i.asin
        ? await call("/catalog/v1/getItems", token, { ...base, itemIds: [i.asin], itemIdType: "ASIN" })
        : await call("/catalog/v1/searchItems", token, { ...base, keywords: i.query || i.model || "", itemCount: 10 });
      const items = data?.itemsResult?.items || data?.searchResult?.items || [];
      const offers: Offer[] = items.map((item: any) => {
        const price = priceOf(item);
        const availability = String(item?.offersV2?.listings?.[0]?.availability?.type || "").toLowerCase();
        const url = item?.detailPageURL || `https://www.amazon.com/dp/${item?.asin || ""}`;
        return {
          retailer: "Amazon", title: titleOf(item), price, shipping: null, currency: "USD",
          availability: availability.includes("out") ? "out_of_stock" : "in_stock",
          url, sku: item?.asin, productId: item?.asin, matchConfidence: 0.5,
        } as Offer;
      }).filter((o: Offer) => Number.isFinite(o.price) && !!o.productId);
      return { provider: "Amazon", offers };
    } catch (e) {
      return { provider: "Amazon", offers: [], warning: e instanceof Error ? e.message : "Amazon request failed." };
    }
  },
};
