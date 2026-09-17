import assert from "node:assert/strict";
import fs from "node:fs";

const match = fs.readFileSync("lib/match.ts", "utf8");
const normalize = fs.readFileSync("lib/normalize.ts", "utf8");
const searchRoute = fs.readFileSync("app/api/search/route.ts", "utf8");
const searchCore = fs.readFileSync("lib/search.ts", "utf8");
const dealRoute = fs.readFileSync("app/api/deal/click/route.ts", "utf8");
const healthRoute = fs.readFileSync("app/api/health/route.ts", "utf8");
const envExample = fs.readFileSync(".env.example", "utf8");
const productionEnv = fs.readFileSync(".env.production.example", "utf8");

assert.match(match, /tb !== undefined \? tb \* 1024 : gb/, "TB storage must normalize to GB");
assert.match(match, /pa\.storageGb && oa\.storageGb && pa\.storageGb !== oa\.storageGb/, "storage variants must conflict");
assert.match(match, /pa\.condition && oa\.condition && pa\.condition !== oa\.condition/, "condition variants must conflict");
assert.match(normalize, /extractAmazonAsin/, "Amazon ASIN extraction must exist");
assert.match(searchCore, /scoreOffer/, "search engine must apply product matching");
assert.match(searchCore, /matchConfidence>=\.70|matchConfidence >= 0\.70/, "search must filter low-confidence offers");
assert.match(dealRoute, /allowedHosts/, "deal redirects must be allowlisted");
assert.match(dealRoute, /new URL\(offer\.url\)/, "deal destination must be parsed as a URL");
assert.match(dealRoute, /destination\.protocol !== "https:"/, "deal redirects must require HTTPS");
assert.match(healthRoute, /version: "12\.1\.0"/, "health endpoint must identify v12.1");
assert.match(envExample, /postgresql:\/\/pricematch:pricematch@localhost:5432\/pricematch/, "local env must use PostgreSQL");
assert.doesNotMatch(envExample, /file:\.\/dev\.db/, "local env must not advertise SQLite");
assert.match(productionEnv, /USE_DEMO_DATA="false"/, "production must disable demo data");
assert.match(productionEnv, /PERSIST_SEARCHES="true"/, "production should persist searches");
console.log("PriceMatch QA smoke checks passed.");
