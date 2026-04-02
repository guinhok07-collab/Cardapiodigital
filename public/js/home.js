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
    const u = JSON.stringify(url);
    el.style.backgroundImage = [
      "linear-gradient(180deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.28) 42%, rgba(0,0,0,.62) 100%)",
      `url(${u})`,
    ].join(", ");
    el.style.backgroundSize = "auto, contain";
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
    tagEl.textContent = tagline || "Toque numa categoria para ver os itens";
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

  const strip = document.getElementById("home-cat-strip");
  if (strip) {
    strip.innerHTML = "";
    categories.forEach((cat) => {
      const a = document.createElement("a");
      const th = themeClass(cat);
      a.className = "home-cat-pill home-cat-pill--flyer home-cat-pill--" + th;
      a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
      a.innerHTML = `<span class="home-cat-pill-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span><span class="home-cat-pill-txt">${escapeHtml(cat.title || "Categoria")}</span>`;
      strip.appendChild(a);
    });
    strip.classList.toggle("hidden", categories.length === 0);
  }

  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";
  categories.forEach((cat, idx) => {
    const th = themeClass(cat);
    const a = document.createElement("a");
    a.className = "flyer-cat flyer-cat--" + th;
    if (categories.length % 2 === 1 && idx === categories.length - 1) {
      a.classList.add("flyer-cat--full");
    }
    a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
    const sub = (cat.subtitle || "").trim();
    a.innerHTML = `
      <span class="flyer-cat-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "•")}</span>
      <div class="flyer-cat-body">
        <div class="flyer-cat-row1">
          <span class="flyer-cat-name">${escapeHtml(cat.title || "Categoria")}</span>
          <span class="flyer-cat-go">›</span>
        </div>
        ${sub ? `<p class="flyer-cat-desc">${escapeHtml(sub)}</p>` : ""}
      </div>
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
