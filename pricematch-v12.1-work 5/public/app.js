form.addEventListener("submit", async e => {
  e.preventDefault();

  const q = input.value.trim();
  if (!q) return input.focus();

  productName.textContent = q.length > 70 ? q.slice(0, 70) + "…" : q;
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth" });

  try {
    const r = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: q,
        url: q.startsWith("http") ? q : undefined
      })
    });

    if (!r.ok) throw new Error("search failed");

    const d = await r.json();

    if (d.product?.title) {
      productName.textContent = d.product.title;
    }

    currentProduct = d.product;

    const productImage = document.getElementById("productImage");
    if (productImage && d.product?.imageUrl) {
      productImage.src = d.product.imageUrl;
    }

    document.getElementById("watchButton").classList.remove("hidden");
    document.getElementById("historySection").classList.remove("hidden");

    loadHistory();

    if (Array.isArray(d.offers) && d.offers.length) {
      renderRows(
        d.offers.map(o => ({
          name: o.retailer,
          price: o.price,
          shipping: o.shipping || 0,
          badge: o.matchConfidence >= 0.98
            ? "Exact match"
            : "Matched product",
          url: o.url,
          offerId: o.offerId
        }))
      );
    } else {
      rowBox.innerHTML =
        '<div class="history-empty">No live retailer prices are available for this search yet.</div>';
    }

  } catch (error) {
    console.error(error);
    rowBox.innerHTML =
      '<div class="history-empty">No live retailer prices are available for this search yet.</div>';
  }
});
