import type { RetailerProvider } from "./types";
import type { ProductInput, Offer } from "../types";
import { fetchWithTimeout } from "../http";

export const bestBuyProvider: RetailerProvider = {
  name: "Best Buy",
  async search(i: ProductInput) {
    const key = process.env.BESTBUY_API_KEY;
    if (!key) return { provider: "Best Buy", offers: [], warning: "BESTBUY_API_KEY is not configured." };
    const raw = i.upc ? `upc:${i.upc}` : i.gtin ? `upc:${i.gtin.slice(-12)}` : i.model ? `modelNumber:${i.model}` : i.query;
    if (!raw) return { provider: "Best Buy", offers: [] };
    try {
      const u = `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(raw)})?apiKey=${encodeURIComponent(key)}&format=json&show=sku,name,salePrice,regularPrice,onlineAvailability,url,upc,modelNumber&sort=salePrice.asc&pageSize=10`;
      const r = await fetchWithTimeout(u, { cache: "no-store" }, 8000);
      if (!r.ok) return { provider: "Best Buy", offers: [], warning: `Best Buy API returned ${r.status}.` };
      const d = await r.json();
      const offers: Offer[] = (d.products || []).map((p: any) => ({
        retailer: "Best Buy", title: p.name || "Best Buy product", price: Number(p.salePrice ?? p.regularPrice), shipping: null,
        currency: "USD", availability: p.onlineAvailability ? "in_stock" : "unknown", url: p.url || "https://www.bestbuy.com/",
        sku: String(p.sku ?? ""), productId: String(p.upc || p.modelNumber || p.sku || ""), matchConfidence: 0.5,
      })).filter((x: Offer) => Number.isFinite(x.price));
      return { provider: "Best Buy", offers };
    } catch (e) {
      return { provider: "Best Buy", offers: [], warning: e instanceof Error ? e.message : "Best Buy request failed." };
    }
  },
};
