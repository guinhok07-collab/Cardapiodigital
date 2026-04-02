import { addItem } from "./cart.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

/** Layouts que usam o poster preto + laranja (mesmo visual do menu burgers). */
const POSTER_LAYOUT_KEYS = new Set([
  "poster-burger",
  "poster-menu",
  "combo-wood",
  "poster-pastel",
]);

export function setBodyLayoutClass(layout) {
  const main = document.getElementById("cardapio-main");
  ["layout-poster-burger", "layout-poster-pastel", "layout-combo-wood"].forEach((c) => {
    document.body.classList.remove(c);
    main?.classList.remove(c);
  });
  if (!layout || layout === "default") return;
  if (POSTER_LAYOUT_KEYS.has(layout)) {
    document.body.classList.add("layout-poster-burger");
    main?.classList.add("layout-poster-burger");
  }
}

function bindAdd(btn, item, catId, catTitle, sectionTitle, onToast) {
  const displayName = sectionTitle ? `${sectionTitle} — ${item.name}` : item.name;
  btn.addEventListener("click", () => {
    addItem({
      catId,
      catTitle,
      item: { id: item.id, name: displayName, price: item.price },
    });
    onToast("Adicionado ao carrinho");
  });
}

const U = "https://images.unsplash.com";

/** Uma foto circular por tema — imagens meramente ilustrativas (aviso no HTML). */
const POSTER_PHOTO_ONE = {
  burger: {
    src: `${U}/photo-1568901346375-23c945677c61?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Hambúrguer artesanal com queijo derretido",
  },
  combo: {
    src: `${U}/photo-1555992336-cbf0c433c5cf?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Hambúrguer com batata frita e molho",
  },
  pastel: {
    src: `${U}/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Pastéis fritos crocantes",
  },
  pizza: {
    src: `${U}/photo-1513104890138-7c7496599c91?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Pizza com queijo e ingredientes",
  },
  sweet: {
    src: `${U}/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Sobremesa doce",
  },
  drinks: {
    src: `${U}/photo-1544145945-f0a224ac7a5e?auto=format&fit=crop&w=720&h=720&q=88`,
    alt: "Refrigerantes e bebidas geladas",
  },
};

function posterHeadlineForCat(cat) {
  const raw = (cat.posterHeadline || "").trim();
  if (raw) return raw.toUpperCase();
  const t = (cat.title || "Cardápio").trim();
  return t.toUpperCase().slice(0, 28);
}

function posterPhotoThemeForCat(cat) {
  const key = String(cat.posterPhotoTheme || "")
    .trim()
    .toLowerCase();
  if (key && POSTER_PHOTO_ONE[key]) return key;
  const id = String(cat.id || "");
  const mapId = {
    "burgers-menu": "burger",
    hamburgueres: "combo",
    pastelaria: "pastel",
    pizza: "pizza",
    doces: "sweet",
    bebidas: "drinks",
  };
  if (mapId[id]) return mapId[id];
  const th = String(cat.theme || "").toLowerCase();
  if (th === "pizza") return "pizza";
  if (th === "pastel") return "pastel";
  if (th === "sweet") return "sweet";
  if (th === "burger") return "burger";
  return "burger";
}

function priceShort(n) {
  return `R$${Math.round(Number(n))}`;
}

function appendBurgerSection(container, sec, catId, catTitle, onToast, burgerStyle) {
  const st = (sec.title || "").trim();
  const sub = (sec.subtitle || "").trim();
  const secEl = document.createElement("section");
  secEl.className = "burger-poster-sec";
  const h3 = document.createElement("h3");
  h3.className = burgerStyle
    ? "burger-poster-sec-title"
    : "burger-poster-sec-title burger-poster-sec-title--orange";
  h3.textContent = st.toUpperCase();
  secEl.appendChild(h3);
  if (sub) {
    const ps = document.createElement("p");
    ps.className = "burger-poster-sec-sub";
    ps.textContent = sub;
    secEl.appendChild(ps);
  }
  (sec.items || []).forEach((item) => {
    if (burgerStyle) {
      const desc = String(item.description || "").trim();
      const row = document.createElement("div");
      row.className = "burger-poster-burger-row";
      row.innerHTML = `
        <div class="burger-poster-burger-text">
          <span class="burger-poster-item-name">${escapeHtml(item.name)}</span>
          ${desc ? `<span class="burger-poster-item-desc">${escapeHtml(desc)}</span>` : ""}
        </div>
        <div class="burger-poster-price-ring"><span>${priceShort(item.price)}</span></div>
        <button type="button" class="burger-poster-add">+</button>
      `;
      const ba = row.querySelector(".burger-poster-add");
      ba.setAttribute("aria-label", `Adicionar ${item.name || "item"}`);
      bindAdd(ba, item, catId, catTitle, st, onToast);
      secEl.appendChild(row);
    } else {
      const row = document.createElement("div");
      row.className = "burger-poster-simple-row";
      row.innerHTML = `
        <span class="burger-poster-simple-name">${escapeHtml(item.name)}</span>
        <span class="burger-poster-simple-price">${priceShort(item.price)}</span>
        <button type="button" class="burger-poster-add-mini" aria-label="Adicionar">+</button>
      `;
      bindAdd(row.querySelector(".burger-poster-add-mini"), item, catId, catTitle, st, onToast);
      secEl.appendChild(row);
    }
  });
  container.appendChild(secEl);
}

function buildPosterPhotoColumn(cat) {
  const theme = posterPhotoThemeForCat(cat);
  const shot = POSTER_PHOTO_ONE[theme] || POSTER_PHOTO_ONE.burger;
  const photos = document.createElement("div");
  photos.className = "burger-poster-photos";
  photos.innerHTML = `
    <figure class="burger-poster-shot burger-poster-shot--single">
      <img
        src="${shot.src}"
        alt="${escapeHtml(shot.alt)}"
        width="360"
        height="360"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        referrerpolicy="no-referrer"
      />
    </figure>`;
  const disc = document.createElement("p");
  disc.className = "burger-poster-disclaimer";
  disc.textContent =
    "Imagens meramente ilustrativas — o preparo e a apresentação podem variar.";
  photos.appendChild(disc);
  return photos;
}

/**
 * Cardápio unificado: preto + laranja, duas colunas quando há `column` left/right;
 * caso contrário, todas as seções na esquerda e fotos à direita.
 */
export function renderPosterMenu(root, cat, catId, catTitle, _store, onToast) {
  root.className = "burger-poster-root";
  root.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "burger-poster";

  const header = document.createElement("header");
  header.className = "burger-poster-header";
  const line2 = escapeHtml(posterHeadlineForCat(cat));
  header.innerHTML = `
    <div class="burger-poster-brand">
      <span class="burger-poster-menu">MENU</span>
      <span class="burger-poster-line"></span>
      <span class="burger-poster-burguers">${line2}</span>
    </div>
  `;

  const sections = cat.sections || [];
  const hasColumnSplit = sections.some(
    (s) => s.column === "left" || s.column === "right"
  );

  const grid = document.createElement("div");
  grid.className = "burger-poster-grid";
  if (hasColumnSplit) {
    grid.classList.add("burger-poster-grid--split");
  } else {
    grid.classList.add("burger-poster-grid--photo-only", "burger-poster-grid--photos-first-sm");
  }

  const left = document.createElement("div");
  left.className = "burger-poster-col burger-poster-col--left";

  const right = document.createElement("div");
  right.className = "burger-poster-col burger-poster-col--right";

  right.appendChild(buildPosterPhotoColumn(cat));

  if (hasColumnSplit) {
    sections
      .filter((s) => s.column !== "right")
      .forEach((sec) => appendBurgerSection(left, sec, catId, catTitle, onToast, true));
    sections
      .filter((s) => s.column === "right")
      .forEach((sec) => appendBurgerSection(right, sec, catId, catTitle, onToast, true));
  } else {
    sections.forEach((sec) =>
      appendBurgerSection(left, sec, catId, catTitle, onToast, true)
    );
  }

  grid.appendChild(left);
  grid.appendChild(right);

  wrap.appendChild(header);
  wrap.appendChild(grid);
  root.appendChild(wrap);
}

/** @deprecated Use renderPosterMenu — mantido para imports antigos. */
export const renderPosterBurger = renderPosterMenu;
