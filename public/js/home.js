import { loadMenuData } from "./data-loader.js";
import { initCartBadge } from "./cart-badge.js";
import { DEFAULT_HOME_HERO, homeHeroOverlayGradient } from "./theme-assets.js";
import { incVisits } from "./finance-stats.js";

const WELCOME_SESSION_KEY = "cardapio_welcome_seen_v1";

const WELCOME_WA_TEXT =
  "Olá! Estou com dúvidas sobre o cardápio ou pedido. Pode me ajudar? 😊";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function applyHomeHeroImage(store) {
  const el = document.getElementById("home-hero-bg");
  if (!el) return;
  const custom = (store.homeHeroImage || "").trim();
  const url = custom || DEFAULT_HOME_HERO;
  document.body.classList.add("home-has-hero-img");
  const u = JSON.stringify(url);
  el.style.backgroundImage = [
    homeHeroOverlayGradient(),
    `url(${u})`,
  ].join(", ");
  el.style.backgroundSize = "cover, cover";
  el.style.backgroundRepeat = "no-repeat, no-repeat";
  el.style.backgroundPosition = "center, center";
}

function renderHome(data) {
  const store = data.store || {};
  document.getElementById("store-name").textContent =
    store.name || "Point do Roger";

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
      brand.textContent = store.name || "Point do Roger";
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

  const heroStripUrl =
    (store.homeHeroImage || "").trim() || DEFAULT_HOME_HERO;

  const categories = data.categories || [];
  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";
  categories.forEach((cat) => {
    const a = document.createElement("a");
    a.className = "home-cat-card";
    a.href = `cardapio.html#cat=${encodeURIComponent(cat.id)}`;
    const theme = String(cat.theme || "default");
    a.dataset.theme = theme;
    const topUrl = heroStripUrl;
    const sub = (cat.subtitle || "").trim();
    a.innerHTML = `
      <div class="home-cat-top" style="background-image:url(${JSON.stringify(topUrl)})" aria-hidden="true"></div>
      <div class="home-cat-body">
        <span class="home-cat-emoji" aria-hidden="true">${escapeHtml(cat.emoji || "📋")}</span>
        <div class="home-cat-text">
          <span class="home-cat-name">${escapeHtml(cat.title || "Categoria")}</span>
          ${sub ? `<span class="home-cat-desc">${escapeHtml(sub)}</span>` : ""}
        </div>
        <span class="home-cat-arrow" aria-hidden="true">→</span>
      </div>
    `;
    grid.appendChild(a);
  });
}

function parseHHMM(s) {
  const v = String(s || "")
    .trim()
    .replace(/[^\d:]/g, "");
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const mm = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return hh * 60 + mm;
}

function isOpenNow(store, now) {
  const openMins = parseHHMM(store.openTime);
  const closeMins = parseHHMM(store.closeTime);

  // Sem horário definido: assume aberto.
  if (openMins == null || closeMins == null) return true;

  // Se o horário "fecha depois" (ex.: 18:00 -> 02:00)
  if (openMins < closeMins) {
    return now >= openMins && now < closeMins;
  }

  // Janela noturna
  return now >= openMins || now < closeMins;
}

function updateOpenClosedBanner(store) {
  const statusEl = document.getElementById("home-open-status");
  const hoursEl = document.getElementById("home-open-hours");
  if (!statusEl || !hoursEl) return;

  const openTime = String(store.openTime || "").trim();
  const closeTime = String(store.closeTime || "").trim();
  const hoursText =
    (String(store.hoursText || "").trim() ||
      (openTime && closeTime ? `Horário: ${openTime} - ${closeTime}` : "Horário: --"));

  hoursEl.textContent = hoursText;

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const open = isOpenNow(store, nowMins);

  if (open) {
    statusEl.textContent = "OPEN";
    statusEl.classList.add("neon-open");
    statusEl.classList.remove("neon-closed");
    statusEl.setAttribute("aria-label", "Aberto");
  } else {
    statusEl.textContent = "CLOSED";
    statusEl.classList.add("neon-closed");
    statusEl.classList.remove("neon-open");
    statusEl.setAttribute("aria-label", "Fechado");
  }
}

function setupWelcomeModal(store) {
  const modal = document.getElementById("welcome-modal");
  if (!modal) return;

  if (sessionStorage.getItem(WELCOME_SESSION_KEY)) {
    modal.classList.add("hidden");
    return;
  }

  const waDigits = String(store.whatsapp || "")
    .replace(/\D/g, "")
    .trim();
  const wa = waDigits || "5511999999999";
  const waLink = document.getElementById("welcome-wa-link");

  let onEscape;
  const close = () => {
    sessionStorage.setItem(WELCOME_SESSION_KEY, "1");
    modal.classList.add("hidden");
    document.body.classList.remove("welcome-modal-open");
    if (onEscape) document.removeEventListener("keydown", onEscape);
  };

  if (waLink) {
    waLink.href = `https://wa.me/${wa}?text=${encodeURIComponent(WELCOME_WA_TEXT)}`;
    waLink.addEventListener("click", () => close());
  }

  modal.querySelectorAll("[data-welcome-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  onEscape = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onEscape);

  modal.classList.remove("hidden");
  document.body.classList.add("welcome-modal-open");
}

async function init() {
  initCartBadge();
  try {
    const data = await loadMenuData();
    renderHome(data);
    updateOpenClosedBanner(data.store || {});
    setInterval(() => updateOpenClosedBanner(data.store || {}), 30000);
    incVisits(1);
  } catch (e) {
    document.getElementById("category-grid").innerHTML =
      `<p class="error-msg">Erro ao carregar o cardápio.</p>`;
    console.error(e);
  }
}

init();
