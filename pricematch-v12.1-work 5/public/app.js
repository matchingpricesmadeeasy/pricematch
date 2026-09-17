const stores = [
  {name:"Amazon", price:199.00, shipping:0, badge:"Prime Eligible"},
  {name:"Walmart", price:199.00, shipping:0, badge:"Free Shipping"},
  {name:"Target", price:204.99, shipping:5.99, badge:"Free Shipping (w/ $35+)"},
  {name:"Best Buy", price:209.99, shipping:0, badge:"Free Shipping"},
  {name:"Home Depot", price:214.00, shipping:0, badge:"Free Shipping (w/ $45+)"}
];

const rowBox = document.getElementById("storeRows");
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const results = document.getElementById("results");
const productName = document.getElementById("productName");
let currentProduct = null;
let historyDays = 90;

function getUserKey(){
  let key = localStorage.getItem("pricematch-user-key");
  if(!key){ key = crypto.randomUUID ? crypto.randomUUID() : "user-" + Math.random().toString(36).slice(2); localStorage.setItem("pricematch-user-key", key); }
  return key;
}

async function saveWatchlist(targetPrice){
  if(!currentProduct?.canonicalId) return;
  const r = await fetch("/api/watchlist", {method:"POST",headers:{"Content-Type":"application/json","x-pricematch-user":getUserKey()},body:JSON.stringify({canonicalId:currentProduct.canonicalId,targetPrice})});
  if(!r.ok) throw new Error("watchlist failed");
  document.getElementById("watchButton").textContent="✓ Watching";
}

async function loadHistory(){
  if(!currentProduct?.canonicalId) return;
  try{
    const r=await fetch(`/api/history/${encodeURIComponent(currentProduct.canonicalId)}?days=${historyDays}`);
    if(!r.ok) throw new Error();
    const d=await r.json(); renderHistory(d);
  }catch{ document.getElementById("historyPanel").innerHTML='<div class="history-empty">Price history will appear after the first few price checks.</div>'; }
}

function renderHistory(data){
  const points=data.offers.flatMap(o=>o.history.map(h=>({date:new Date(h.capturedAt),total:h.total,retailer:o.retailer})));
  const panel=document.getElementById("historyPanel");
  if(!points.length){panel.innerHTML='<div class="history-empty">No historical snapshots yet. Run more comparisons to build the chart.</div>';return;}
  const min=Math.min(...points.map(p=>p.total)), max=Math.max(...points.map(p=>p.total));
  const width=760,height=190,pad=24;
  const x=d=>pad+(d.getTime()-Math.min(...points.map(p=>p.date.getTime())))/Math.max(1,Math.max(...points.map(p=>p.date.getTime()))-Math.min(...points.map(p=>p.date.getTime())))*(width-pad*2);
  const y=v=>height-pad-(v-min)/Math.max(1,max-min)*(height-pad*2);
  const paths=data.offers.map(o=>{const h=o.history;if(h.length<2)return '';return `<polyline fill="none" stroke="currentColor" stroke-width="2.5" points="${h.map(a=>`${x(new Date(a.capturedAt)).toFixed(1)},${y(a.total).toFixed(1)}`).join(' ')}"/>`;}).join('');
  panel.innerHTML=`<div class="history-summary"><div><small>Lowest recorded</small><b>${money(min)}</b></div><div><small>Current lowest</small><b>${money(Math.min(...data.offers.map(o=>o.current.total),Infinity))}</b></div><div class="history-controls"><button class="history-tab ${historyDays===30?'active':''}" data-days="30">30d</button><button class="history-tab ${historyDays===90?'active':''}" data-days="90">90d</button><button class="history-tab ${historyDays===365?'active':''}" data-days="365">1y</button></div></div><div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Price history chart"><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" stroke="#dbe3ef"/>${paths}</svg></div>`;
  panel.querySelectorAll('.history-tab').forEach(b=>b.addEventListener('click',()=>{historyDays=Number(b.dataset.days);loadHistory();}));
}


function money(n){ return "$" + n.toFixed(2); }

async function openDeal(item){
  if(!item.offerId){ alert('Deal links will be active once a live retailer offer is connected.'); return; }
  try{
    const r=await fetch('/api/deal/click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offerId:item.offerId})});
    const d=await r.json();
    if(!r.ok || !d.url) throw new Error();
    window.open(d.url,'_blank','noopener,noreferrer');
  }catch{ alert('We could not open this deal right now.'); }
}

function renderRows(items=stores){
  const lowest = Math.min(...items.map(s => s.price + s.shipping));
  rowBox.innerHTML = items.map(s => {
    const total = s.price + s.shipping;
    const isLowest = total === lowest;
    return `<div class="store-row ${isLowest ? "lowest-row" : ""}">
      <div class="store-name">${s.name}<small>${s.badge}</small></div>
      <div class="price">${money(s.price)}</div>
      <div class="ship">${s.shipping ? money(s.shipping) : "Free"}</div>
      <div class="price">${money(total)} ${isLowest ? '<span class="lowest-label">LOWEST</span>' : ''}<div class="last-checked">Checked just now</div></div>
      <div class="availability">In Stock</div>
      <button class="deal" onclick='openDeal(${JSON.stringify({offerId:s.offerId||null,url:s.url||null})})'>View Deal ↗</button>
    </div>`;
  }).join("");
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return input.focus();
  productName.textContent = q.length > 70 ? q.slice(0,70) + "…" : q;
  results.classList.remove("hidden");
  results.scrollIntoView({behavior:"smooth"});
  try {
    const r = await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q,url:q.startsWith("http")?q:undefined})});
    if(!r.ok) throw new Error("search failed");
    const d = await r.json();
    if(d.product?.title) productName.textContent=d.product.title;
currentProduct=d.product;

const productImage = document.getElementById("productImage");
if(productImage && d.product?.imageUrl) productImage.src = d.product.imageUrl;

document.getElementById("watchButton").classList.remove("hidden");
    loadHistory();
  if(Array.isArray(d.offers) && d.offers.length){
  renderRows(d.offers.map(o=>({name:o.retailer,price:o.price,shipping:o.shipping||0,badge:o.matchConfidence>=.98?"Exact match":"Matched product",url:o.url,offerId:o.offerId})));
} else {
  rowBox.innerHTML = '<div class="history-empty">No live retailer prices are available for this search yet.</div>';
}
} catch {
  rowBox.innerHTML = '<div class="history-empty">No live retailer prices are available for this search yet.</div>';
}

document.getElementById("priceRange").addEventListener("input", e => {
  document.getElementById("rangeValue").textContent = e.target.value >= 500 ? "$500+" : "$" + e.target.value;
});

document.getElementById("sortSelect").addEventListener("change", e => {
  const items = [...stores];
  if(e.target.value === "price") items.sort((a,b)=>(a.price+a.shipping)-(b.price+b.shipping));
  else items.sort((a,b)=>a.name.localeCompare(b.name));
  renderRows(items);
});

renderRows();
