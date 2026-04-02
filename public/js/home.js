import { loadMenuData } from "./data-loader.js";
import { initCartBadge } from "./cart-badge.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function applyHomeHeroImage(store) {
  const el = document.getElementById("home-hero-bg");
  if (!el) return;
  const url = (store.homeHeroImage || "").trim();
  if (url) {
    const u = JSON.stringify(url);
    el.style.backgroundImage = [
      "linear-gradient(180deg, rgba(15,23,42,.88) 0%, rgba(15,23,42,.75) 50%, rgba(2,6,23,.92) 100%)",
      `url(${u})`,
    ].join(", ");
    el.style.backgroundSize = "auto, cover";
    el.style.backgroundRepeat = "no-repeat, no-repeat";
    el.style.backgroundPosition = "center, center center";
  } else {
    el.style.backgroundImage = "";
    el.style.backgroundSize = "";
    el.style.backgroundRepeat = "";
    el.style.backgroundPosition = "";
  }
}

function renderHome(data) {
  const store = data.store || {};
  document.getElementById("store-name").textContent =
    store.name || "Cardápio Digital";

  const tagline = (store.headline || "").trim();
  const tagEl = document.getElementById("headline");
  if (tagEl) {
    tagEl.textContent = tagline || "Escolha uma categoria abaixo";
  }

  const subEl = document.getElementById("subhead");
  const sub = (store.subhead || "").trim();
  if (subEl) {
    subEl.textContent = sub;
    subEl.classList.toggle("hidden", !sub);
  }

  applyHomeHeroImage(store);

  const brand = document.getElementById("top-brand");
  const logoEl = document.getElementById("top-brand-logo");
  const useLogo =
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

  const categories = data.categories || [];
  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";
  categories.forEach((cat) => {
    const a = document.createElement("a");
    a.className = "home-cat-card";
    a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
    const sub = (cat.subtitle || "").trim();
    a.innerHTML = `
      <span class="home-cat-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span>
      <div class="home-cat-text">
        <span class="home-cat-name">${escapeHtml(cat.title || "Categoria")}</span>
        ${sub ? `<span class="home-cat-desc">${escapeHtml(sub)}</span>` : ""}
      </div>
      <span class="home-cat-arrow" aria-hidden="true">→</span>
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
