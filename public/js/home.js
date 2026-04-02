import { loadMenuData } from "./data-loader.js";
import { initCartBadge } from "./cart-badge.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function renderHome(data) {
  const store = data.store || {};
  document.getElementById("store-name").textContent =
    store.name || "Cardápio Digital";
  document.getElementById("headline").textContent =
    store.headline || "Monte seu pedido";
  document.getElementById("subhead").textContent =
    store.subhead ||
    "Escolha uma categoria, adicione ao carrinho e finalize no WhatsApp.";

  const brand = document.getElementById("top-brand");
  if (brand) brand.textContent = store.name || "Cardápio";

  const heroBottom = document.getElementById("hero-bottom-wrap");
  const heroImg = document.getElementById("hero-img");
  if (heroBottom && heroImg) {
    if (store.heroImage) {
      heroImg.src = store.heroImage;
      heroImg.alt = store.name || "";
      heroBottom.classList.remove("hidden");
      heroBottom.setAttribute("aria-hidden", "false");
    } else {
      heroBottom.classList.add("hidden");
      heroBottom.setAttribute("aria-hidden", "true");
    }
  }

  const footAddr = document.getElementById("footer-address");
  if (footAddr) {
    const addr = (store.address || "").trim();
    if (addr) {
      footAddr.textContent = "📍 " + addr;
      footAddr.classList.remove("hidden");
    } else {
      footAddr.textContent = "";
      footAddr.classList.add("hidden");
    }
  }

  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";
  (data.categories || []).forEach((cat) => {
    const a = document.createElement("a");
    a.className = "category-card";
    a.href = `cardapio.html?cat=${encodeURIComponent(cat.id)}`;
    const sub = (cat.subtitle || "").trim();
    a.innerHTML = `
      <span class="category-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span>
      <div class="category-text">
        <h2 class="category-title">${escapeHtml(cat.title || "Categoria")}</h2>
        ${sub ? `<span class="category-sub">${escapeHtml(sub)}</span>` : ""}
      </div>
      <span class="category-cta">Abrir</span>
    `;
    grid.appendChild(a);
  });
}

async function init() {
  initCartBadge();
  try {
    const data = await loadMenuData();
    renderHome(data);
  } catch (e) {
    document.getElementById("category-grid").innerHTML =
      `<p class="error-msg">Erro ao carregar o cardápio.</p>`;
    console.error(e);
  }
}

init();
