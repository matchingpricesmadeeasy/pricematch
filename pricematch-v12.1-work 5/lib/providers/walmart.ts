import type { RetailerProvider } from "./types";
import type { ProductInput, Offer } from "../types";
import { fetchWithTimeout } from "../http";

export const walmartProvider: RetailerProvider = {
  name: "Walmart",
  async search(i: ProductInput) {
    const token = process.env.WALMART_ACCESS_TOKEN;
    if (!token) return { provider: "Walmart", offers: [], warning: "WALMART_ACCESS_TOKEN is not configured." };
    const params = new URLSearchParams();
    if (i.upc) params.set("upc", i.upc);
    else if (i.gtin) params.set("gtin", i.gtin);
    else if (i.asin) { params.set("asin", i.asin); params.set("responseFormat", "SPEC"); }
    else params.set("query", i.query || i.model || "");
    try {
      const r = await fetchWithTimeout(`https://marketplace.walmartapis.com/v3/items/walmart/search?${params}`, {
        headers: {
          "WM_SEC.ACCESS_TOKEN": token,
          "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
          "WM_SVC.NAME": process.env.WALMART_SVC_NAME || "PriceMatch",
          "WM_GLOBAL_VERSION": "3.1",
          "WM_MARKET": process.env.WALMART_MARKET || "US",
          Accept: "application/json",
        }, cache: "no-store",
      }, 9000);
      if (!r.ok) return { provider: "Walmart", offers: [], warning: `Walmart API returned ${r.status}.` };
      const d = await r.json();
      const offers: Offer[] = (d.items || []).map((p: any) => ({
        retailer: "Walmart", title: p.title || p.productName || "Walmart product", price: Number(p.price ?? p.currentPrice), shipping: null,
        currency: "USD", availability: p.isPublished === false ? "out_of_stock" : "in_stock",
        url: p.productUrl || (p.itemId ? `https://www.walmart.com/ip/${p.itemId}` : "https://www.walmart.com/"),
        sku: String(p.itemId || p.upc || p.gtin || ""), productId: String(p.upc || p.gtin || p.itemId || ""), matchConfidence: 0.5,
      })).filter((x: Offer) => Number.isFinite(x.price));
      return { provider: "Walmart", offers };
    } catch (e) {
      return { provider: "Walmart", offers: [], warning: e instanceof Error ? e.message : "Walmart request failed." };
    }
  },
};
