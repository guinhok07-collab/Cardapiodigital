import { loadMenuData } from "./data-loader.js";
import { addItem } from "./cart.js";
import { initCartBadge } from "./cart-badge.js";
import { DEFAULT_HOME_HERO } from "./theme-assets.js";
import { renderPosterMenu, setBodyLayoutClass } from "./cardapio-layouts.js";

function formatMoney(n) {
  return Number(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getCatIdFromLocation() {
  const fromSearch = new URLSearchParams(window.location.search).get("cat");
  if (fromSearch && String(fromSearch).trim()) return String(fromSearch).trim();
  if (window.location.hash && window.location.hash.length > 1) {
    const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fromHash = hp.get("cat");
    if (fromHash && String(fromHash).trim()) return String(fromHash).trim();
  }
  return "";
}

function applyCategoryTheme(_theme) {
  const body = document.body;
  body.classList.remove(
    "cardapio-theme-burger",
    "cardapio-theme-pastel",
    "cardapio-theme-pizza",
    "cardapio-theme-sweet",
    "cardapio-theme-default"
  );
  const t = String(_theme || "default").trim().toLowerCase();
  const allowed = new Set(["burger", "pastel", "pizza", "sweet", "default"]);
  const key = allowed.has(t) ? t : "default";
  body.classList.add(`cardapio-theme-${key}`);
}

/** Mesma foto da home (`homeHeroImage` ou padrão), em toda página de itens. */
function applyStoreHeroBackground(store) {
  const url =
    (store && store.homeHeroImage && String(store.homeHeroImage).trim()) ||
    DEFAULT_HOME_HERO;
  document.body.style.setProperty("--cardapio-bg-photo", `url(${JSON.stringify(url)})`);
  const strip = document.getElementById("cardapio-hero-strip");
  if (strip) {
    strip.style.backgroundImage = `url(${JSON.stringify(url)})`;
    strip.classList.remove("is-hidden");
  }
}

function getMenuLayout(cat) {
  return (cat && cat.menuLayout) || "default";
}

/** Mesmo visual do menu burgers (poster preto + laranja). */
function isPosterMenuLayout(layout) {
  return ["poster-burger", "poster-menu", "combo-wood", "poster-pastel"].includes(layout);
}

function applyLayoutBackground(store, layout) {
  const strip = document.getElementById("cardapio-hero-strip");
  if (layout !== "default") {
    document.body.style.removeProperty("--cardapio-bg-photo");
    if (strip) {
      strip.style.backgroundImage = "";
      strip.classList.add("is-hidden");
    }
    return;
  }
  applyStoreHeroBackground(store);
}

function setLayoutChrome(layout) {
  const bar = document.querySelector(".cardapio-bar");
  if (layout !== "default") bar?.classList.add("cardapio-bar--minimal");
  else bar?.classList.remove("cardapio-bar--minimal");
}

function resetLayoutsAndChrome() {
  setBodyLayoutClass("default");
  setLayoutChrome("default");
}

function toast(msg) {
  let t = document.getElementById("cart-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "cart-toast";
    t.className = "cart-toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("is-visible"), 2000);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

/** Fotos demonstração (Unsplash) — substitua por URLs próprias no JSON se quiser. */
const U = "https://images.unsplash.com";
const DEMO_IMG = {
  burger: `${U}/photo-1568901346375-23c945677c61?auto=format&fit=crop&w=400&h=400&q=82`,
  burger2: `${U}/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&h=400&q=82`,
  bacon: `${U}/photo-1553979459-b859fc4b6b29?auto=format&fit=crop&w=400&h=400&q=82`,
  salad: `${U}/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=400&h=400&q=82`,
  cheese: `${U}/photo-1550317138-10000687a94b?auto=format&fit=crop&w=400&h=400&q=82`,
  tasty: `${U}/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&h=400&q=82`,
  pizza: `${U}/photo-1513104890138-7c7496599c91?auto=format&fit=crop&w=400&h=400&q=82`,
  pizzaMeat: `${U}/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&h=400&q=82`,
  pastel: `${U}/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&h=400&q=82`,
  fries: `${U}/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=400&q=82`,
  fried: `${U}/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&h=400&q=82`,
  sweet: `${U}/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&h=400&q=82`,
  drink: `${U}/photo-1544145945-f0a224ac7a5e?auto=format&fit=crop&w=400&h=400&q=82`,
  juice: `${U}/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&h=400&q=82`,
};

function resolveDemoImage(item, categoryTheme) {
  if (item.image && String(item.image).trim()) return String(item.image).trim();
  const t = `${item.name || ""} ${item.description || ""}`.toLowerCase();
  const th = categoryTheme || "default";

  if (th === "pizza") {
    if (/pepperoni|bacon|calabresa|carne seca|frango com|quatro queijos/.test(t))
      return DEMO_IMG.pizzaMeat;
    return DEMO_IMG.pizza;
  }
  if (th === "sweet") return DEMO_IMG.sweet;
  if (th === "default") {
    if (/suco|laranja|polpa|maracujá|abacaxi|caju/.test(t)) return DEMO_IMG.juice;
    return DEMO_IMG.drink;
  }
  if (th === "pastel") {
    if (/coxinha|kibe|risole|bolinho/.test(t)) return DEMO_IMG.fried;
    if (/batata|mandioca|anéis|porção/.test(t)) return DEMO_IMG.fries;
    return DEMO_IMG.pastel;
  }
  if (th === "burger") {
    if (/x-bacon/.test(t)) return DEMO_IMG.bacon;
    if (/x-salada/.test(t)) return DEMO_IMG.salad;
    if (/big tasty/.test(t)) return DEMO_IMG.tasty;
    if (/cheddar/.test(t)) return DEMO_IMG.cheese;
    if (/x-burguer/.test(t)) return DEMO_IMG.burger2;
    return DEMO_IMG.burger;
  }
  return DEMO_IMG.burger;
}

function buildItemCard(item, catId, catTitle, sectionTitle, categoryTheme) {
  const displayName = sectionTitle
    ? `${sectionTitle} — ${item.name}`
    : item.name;
  const available = item.available !== false;

  const art = document.createElement("article");
  art.className = "item-card";
  const imgWrap = document.createElement("div");
  imgWrap.className = "item-img-wrap";
  const src = resolveDemoImage(item, categoryTheme);
  const img = document.createElement("img");
  img.src = src;
  img.alt = item.name || "Produto";
  img.className = "item-img";
  img.loading = "lazy";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", () => {
    img.remove();
    imgWrap.classList.add("item-img-placeholder");
    imgWrap.innerHTML = "";
    imgWrap.setAttribute("aria-hidden", "true");
  });
  imgWrap.appendChild(img);
  const bodyEl = document.createElement("div");
  bodyEl.className = "item-body";
  bodyEl.innerHTML = `
    <h2>${escapeHtml(item.name)}</h2>
    <p class="item-desc">${escapeHtml(item.description || "")}</p>
    <div class="item-row-actions">
      <span class="item-price">${formatMoney(item.price)}</span>
    </div>
  `;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-add-cart";
  btn.textContent = available ? "Adicionar" : "Indisponível";
  btn.setAttribute("aria-label", available ? "Adicionar ao carrinho" : "Indisponível no momento");
  if (!available) btn.classList.add("is-unavailable");
  btn.addEventListener("click", () => {
    if (!available) {
      toast("Indisponível no momento");
      return;
    }
    addItem({
      catId,
      catTitle,
      item: {
        id: item.id,
        name: displayName,
        price: item.price,
      },
    });
    toast("Adicionado ao carrinho");
  });
  bodyEl.querySelector(".item-row-actions").appendChild(btn);
  art.appendChild(imgWrap);
  art.appendChild(bodyEl);
  return art;
}

function renderCategoryPicker(root, categories, storeName, store) {
  applyCategoryTheme("default");
  resetLayoutsAndChrome();
  applyStoreHeroBackground(store || {});
  document.title = `Cardápio — ${storeName || "Point do Roger"}`;
  const titleEl = document.getElementById("cat-title");
  if (titleEl) titleEl.textContent = "Escolha uma categoria";
  const em = document.getElementById("cat-emoji");
  if (em) {
    em.textContent = "📋";
    em.style.display = "";
  }
  const subEl = document.getElementById("cat-subtitle");
  if (subEl) {
    subEl.textContent = "Hambúrgueres, pastéis, pizza, doces e bebidas — toque para ver tudo.";
    subEl.hidden = false;
  }
  const links = (categories || [])
    .map((c) => {
      const id = encodeURIComponent(c.id);
      const label = escapeHtml(c.title || c.id);
      const sub = (c.subtitle || "").trim();
      const subHtml = sub
        ? `<span class="picker-sub">${escapeHtml(sub)}</span>`
        : "";
      return `<a class="picker-link" href="#cat=${id}">${label}${subHtml}</a>`;
    })
    .join("");
  root.className = "items-list";
  root.innerHTML = `
    <div class="category-picker">
      <p class="picker-lead">Selecione abaixo ou volte ao <a href="index.html#cardapio">início</a>.</p>
      <div class="picker-list">${links}</div>
    </div>`;
}

async function renderCardapio() {
  const catId = getCatIdFromLocation();
  const root = document.getElementById("items-root");
  if (!root) return;

  try {
    const data = await loadMenuData();
    const store = data.store || {};
    const categories = data.categories || [];

    if (!catId) {
      renderCategoryPicker(root, categories, store.name, store);
      return;
    }

    const cat = categories.find((c) => c.id === catId);
    if (!cat) {
      applyCategoryTheme("default");
      resetLayoutsAndChrome();
      applyStoreHeroBackground(store);
      root.className = "items-list";
      root.innerHTML = `<p class="error-msg">Categoria não encontrada.</p>`;
      return;
    }
    applyCategoryTheme(cat.theme);
    const layout = getMenuLayout(cat);
    setBodyLayoutClass(layout);
    applyLayoutBackground(store, layout);
    setLayoutChrome(layout);

    document.title = `${cat.title} — ${store.name || "Point do Roger"}`;
    const titleNode = document.getElementById("cat-title");
    if (titleNode) titleNode.textContent = cat.title;
    const em = document.getElementById("cat-emoji");
    if (em) {
      em.textContent = cat.emoji || "";
      em.style.display = cat.emoji ? "" : "none";
    }
    const subEl = document.getElementById("cat-subtitle");
    if (subEl) {
      const sub = (cat.subtitle || "").trim();
      subEl.textContent = sub;
      subEl.hidden = !sub || layout !== "default";
    }

    const catTitle = cat.title || "Item";

    if (isPosterMenuLayout(layout)) {
      renderPosterMenu(root, cat, catId, catTitle, store, toast);
      return;
    }

    root.className = "items-list cardapio-items-panel";
    root.innerHTML = "";

    const sections = cat.sections;
    if (sections && Array.isArray(sections) && sections.length > 0) {
      sections.forEach((sec) => {
        const st = (sec.title || "").trim();
        const h = document.createElement("h3");
        h.className = "menu-section-title";
        h.textContent = st || "Itens";
        root.appendChild(h);
        const lead = (sec.subtitle || "").trim();
        if (lead) {
          const p = document.createElement("p");
          p.className = "menu-section-lead";
          p.textContent = lead;
          root.appendChild(p);
        }
        (sec.items || []).forEach((item) => {
          root.appendChild(
            buildItemCard(item, catId, catTitle, st || null, cat.theme)
          );
        });
      });
    } else {
      (cat.items || []).forEach((item) => {
        root.appendChild(buildItemCard(item, catId, catTitle, null, cat.theme));
      });
    }
  } catch (e) {
    applyCategoryTheme("default");
    resetLayoutsAndChrome();
    applyStoreHeroBackground({});
    root.className = "items-list";
    root.innerHTML = `<p class="error-msg">Erro ao carregar itens.</p>`;
    console.error(e);
  }
}

function init() {
  initCartBadge();
  renderCardapio();
  window.addEventListener("hashchange", () => {
    renderCardapio();
  });
}

init();
