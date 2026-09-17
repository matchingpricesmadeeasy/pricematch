import { scoreOffer } from "./lib/match";

const product = {
  canonicalId: "query:iphone 16 pro 256gb",
  title: "Apple iPhone 16 Pro 256GB Black",
  matchConfidence: .55
};

const same = {
  retailer:"Test", title:"Apple iPhone 16 Pro 256GB Black", price:999, shipping:0,
  currency:"USD", availability:"in_stock" as const, url:"#", matchConfidence:.5
};

const wrongStorage = {...same, title:"Apple iPhone 16 Pro 512GB Black"};

console.assert(scoreOffer(product, same) > .9, "same variant should score highly");
console.assert(scoreOffer(product, wrongStorage) < .3, "wrong storage should be rejected");
console.log("Product matching smoke test passed.");
