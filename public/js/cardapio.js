import { loadMenuData } from "./data-loader.js";
import { addItem } from "./cart.js";
import { initCartBadge } from "./cart-badge.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function formatMoney(n) {
  return Number(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getQueryCat() {
  return new URLSearchParams(window.location.search).get("cat") || "";
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

async function init() {
  initCartBadge();
  const catId = getQueryCat();
  const root = document.getElementById("items-root");
  if (!catId) {
    window.location.href = "index.html";
    return;
  }

  try {
    const data = await loadMenuData();
    const store = data.store || {};
    const cat = (data.categories || []).find((c) => c.id === catId);
    if (!cat) {
      root.innerHTML = `<p class="error-msg">Categoria não encontrada.</p>`;
      return;
    }
    document.title = `${cat.title} — ${store.name || "Cardápio"}`;
    document.getElementById("cat-title").textContent = cat.title;
    const em = document.getElementById("cat-emoji");
    em.textContent = cat.emoji || "";
    em.style.display = cat.emoji ? "" : "none";
    const subEl = document.getElementById("cat-subtitle");
    if (subEl) {
      const sub = (cat.subtitle || "").trim();
      subEl.textContent = sub;
      subEl.hidden = !sub;
    }

    root.innerHTML = "";
    (cat.items || []).forEach((item) => {
      const art = document.createElement("article");
      art.className = "item-card";
      const imgWrap = document.createElement("div");
      imgWrap.className = "item-img-wrap";
      if (item.image) {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = "";
        img.className = "item-img";
        imgWrap.appendChild(img);
      } else {
        imgWrap.classList.add("item-img-placeholder");
        imgWrap.setAttribute("aria-hidden", "true");
      }
      const body = document.createElement("div");
      body.className = "item-body";
      body.innerHTML = `
        <h2>${escapeHtml(item.name)}</h2>
        <p class="item-desc">${escapeHtml(item.description || "")}</p>
        <div class="item-price">${formatMoney(item.price)}</div>
      `;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-add-cart";
      btn.textContent = "Adicionar ao carrinho";
      btn.addEventListener("click", () => {
        addItem({
          catId,
          catTitle: cat.title,
          item: { id: item.id, name: item.name, price: item.price },
        });
        toast("Adicionado ao carrinho");
      });
      body.appendChild(btn);
      art.appendChild(imgWrap);
      art.appendChild(body);
      root.appendChild(art);
    });
  } catch (e) {
    root.innerHTML = `<p class="error-msg">Erro ao carregar itens.</p>`;
    console.error(e);
  }
}

init();
