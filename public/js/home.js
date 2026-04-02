import { loadMenuData } from "./data-loader.js";
import { initCartBadge } from "./cart-badge.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function themeClass(cat) {
  const t = cat.theme;
  if (t === "pastel") return "pastel";
  if (t === "burger") return "burger";
  if (t === "pizza") return "pizza";
  if (t === "sweet") return "sweet";
  return "default";
}

function applyHomeHeroImage(store) {
  const el = document.getElementById("home-hero-bg");
  if (!el) return;
  const url = (store.homeHeroImage || "").trim();
  if (url) {
    el.style.backgroundImage = `url(${JSON.stringify(url)})`;
  } else {
    el.style.backgroundImage = "";
  }
}

function renderHome(data) {
  const store = data.store || {};
  document.getElementById("store-name").textContent =
    store.name || "Cardápio Digital";
  document.getElementById("headline").textContent =
    store.headline || "Monte seu pedido";
  document.getElementById("subhead").textContent =
    store.subhead ||
    "Escolha uma categoria e monte o pedido.";

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

  const strip = document.getElementById("home-cat-strip");
  if (strip) {
    strip.innerHTML = "";
    categories.forEach((cat) => {
      const a = document.createElement("a");
      const th = themeClass(cat);
      a.className = "home-cat-pill home-cat-pill--" + th;
      a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
      a.innerHTML = `<span class="home-cat-pill-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span><span class="home-cat-pill-txt">${escapeHtml(cat.title || "Categoria")}</span>`;
      strip.appendChild(a);
    });
    strip.classList.toggle("hidden", categories.length === 0);
  }

  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";
  categories.forEach((cat) => {
    const th = themeClass(cat);
    const a = document.createElement("a");
    a.className =
      "category-card category-card--compact category-card--" + th;
    a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
    const sub = (cat.subtitle || "").trim();
    a.innerHTML = `
      <span class="category-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span>
      <div class="category-text">
        <h3 class="category-title">${escapeHtml(cat.title || "Categoria")}</h3>
        ${sub ? `<span class="category-sub">${escapeHtml(sub)}</span>` : ""}
      </div>
      <span class="category-cta" aria-hidden="true">›</span>
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
    const strip = document.getElementById("home-cat-strip");
    if (strip) strip.innerHTML = "";
    document.getElementById("category-grid").innerHTML =
      `<p class="error-msg">Erro ao carregar o cardápio.</p>`;
    console.error(e);
  }
}

init();
