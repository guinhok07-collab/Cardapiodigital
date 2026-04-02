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
  const logoEl = document.getElementById("top-brand-logo");
  var useLogo =
    store.logoMode === "image" && (store.logoImage || "").trim().length > 0;
  if (useLogo && logoEl) {
    logoEl.src = String(store.logoImage).trim();
    logoEl.alt = store.name ? String(store.name) : "Logo";
    logoEl.classList.remove("hidden");
    if (brand) brand.classList.add("hidden");
  } else {
    if (logoEl) {
      logoEl.removeAttribute("src");
      logoEl.classList.add("hidden");
    }
    if (brand) {
      brand.classList.remove("hidden");
      brand.textContent = store.name || "Cardápio";
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
    const th =
      cat.theme === "pastel"
        ? "pastel"
        : cat.theme === "burger"
          ? "burger"
          : cat.theme === "pizza"
            ? "pizza"
            : cat.theme === "sweet"
              ? "sweet"
              : "default";
    a.className = "category-card category-card--" + th;
    a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
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
