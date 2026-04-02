import { loadMenuData } from "./data-loader.js";
import {
  getLines,
  setQty,
  removeLine,
  clearCart,
  getSubtotal,
  formatMoney,
  buildWhatsappText,
  openWhatsappOrder,
  generateOrderNumber,
} from "./cart.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

/** Dados da loja para PIX / link de cartão (definidos em menu-data.json). */
let storeCache = {};

function applyPaymentHints(store) {
  storeCache = store || {};
  const section = document.getElementById("payment-hints");
  const pixBlock = document.getElementById("pix-hint-block");
  const cardBlock = document.getElementById("card-hint-block");
  const pixKeyEl = document.getElementById("pix-key-display");
  const pixHolder = document.getElementById("pix-holder-line");
  const pixQr = document.getElementById("pix-qr-img");
  const cardLink = document.getElementById("card-pay-link");
  const noteEl = document.getElementById("payment-note-hint");
  const labelCardOnline = document.getElementById("pay-label-card-online");

  const pixKey = (store.pixKey || "").trim();
  const pixName = (store.pixHolderName || "").trim();
  const pixQrUrl = (store.pixQrUrl || "").trim();
  const cardUrl = (store.paymentCardLink || "").trim();
  const note = (store.paymentNote || "").trim();

  const showPix = !!pixKey;
  const showCard = !!cardUrl;

  if (!showPix && !showCard && !note) {
    section.classList.add("hidden");
  } else {
    section.classList.remove("hidden");
  }

  if (showPix) {
    pixBlock.classList.remove("hidden");
    pixKeyEl.textContent = pixKey;
    if (pixName) {
      pixHolder.textContent = "Titular: " + pixName;
      pixHolder.classList.remove("hidden");
    } else {
      pixHolder.textContent = "";
      pixHolder.classList.add("hidden");
    }
    if (pixQrUrl) {
      pixQr.src = pixQrUrl;
      pixQr.classList.remove("hidden");
    } else {
      pixQr.removeAttribute("src");
      pixQr.classList.add("hidden");
    }
  } else {
    pixBlock.classList.add("hidden");
  }

  if (showCard) {
    cardBlock.classList.remove("hidden");
    cardLink.href = cardUrl;
  } else {
    cardBlock.classList.add("hidden");
    cardLink.removeAttribute("href");
  }

  if (note) {
    noteEl.textContent = note;
    noteEl.classList.remove("hidden");
  } else {
    noteEl.textContent = "";
    noteEl.classList.add("hidden");
  }

  if (labelCardOnline) {
    if (showCard) labelCardOnline.classList.remove("hidden");
    else labelCardOnline.classList.add("hidden");
  }
}

function setupPixCopy() {
  const btn = document.getElementById("btn-copy-pix");
  const feedback = document.getElementById("pix-copy-feedback");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const key = (storeCache.pixKey || "").trim();
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      if (feedback) {
        feedback.textContent = "Chave copiada.";
        feedback.classList.remove("hidden");
        setTimeout(() => feedback.classList.add("hidden"), 2500);
      }
    } catch {
      if (feedback) {
        feedback.textContent = "Copie manualmente a chave acima.";
        feedback.classList.remove("hidden");
      }
    }
  });
}

function render() {
  const lines = getLines();
  const emptyEl = document.getElementById("empty-cart");
  const contentEl = document.getElementById("cart-content");
  const root = document.getElementById("cart-lines");
  const totalEl = document.getElementById("cart-total");

  if (lines.length === 0) {
    emptyEl.classList.remove("hidden");
    contentEl.classList.add("hidden");
    return;
  }
  emptyEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  root.innerHTML = "";
  lines.forEach((L) => {
    const sub = (Number(L.price) || 0) * (L.qty || 0);
    const row = document.createElement("div");
    row.className = "cart-line";
    row.innerHTML = `
      <div class="cart-line-info">
        <span class="cart-line-name">${escapeHtml(L.name)}</span>
        <span class="cart-line-meta">${escapeHtml(L.catTitle)} · ${formatMoney(L.price)} un.</span>
      </div>
      <div class="cart-line-actions">
        <div class="qty-control">
          <button type="button" class="qty-btn" data-act="minus" data-key="${escapeHtml(L.key)}">−</button>
          <span class="qty-val">${L.qty}</span>
          <button type="button" class="qty-btn" data-act="plus" data-key="${escapeHtml(L.key)}">+</button>
        </div>
        <span class="cart-line-sub">${formatMoney(sub)}</span>
        <button type="button" class="btn-remove-line" data-key="${escapeHtml(L.key)}">✕</button>
      </div>
    `;
    root.appendChild(row);
  });

  root.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      const line = lines.find((x) => x.key === key);
      if (!line) return;
      const q =
        line.qty + (btn.getAttribute("data-act") === "plus" ? 1 : -1);
      setQty(key, q);
      render();
    });
  });
  root.querySelectorAll(".btn-remove-line").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeLine(btn.getAttribute("data-key"));
      render();
    });
  });

  totalEl.textContent = formatMoney(getSubtotal());
}

function syncOrderModeAddress(form) {
  if (!form) return;
  const fd = new FormData(form);
  const mode = String(fd.get("orderMode") || "");
  const needAddr = mode === "delivery";
  const street = form.querySelector('[name="street"]');
  const number = form.querySelector('[name="number"]');
  const neigh = form.querySelector('[name="neighborhood"]');
  const wrap = document.getElementById("address-fields");
  [street, number, neigh].forEach((el) => {
    if (!el) return;
    if (needAddr) el.setAttribute("required", "");
    else el.removeAttribute("required");
  });
  if (wrap) wrap.classList.toggle("address-fields--delivery", needAddr);
}

const checkoutForm = document.getElementById("checkout-form");
if (checkoutForm) {
  checkoutForm.addEventListener("change", (ev) => {
    if (ev.target && ev.target.name === "orderMode") {
      syncOrderModeAddress(checkoutForm);
    }
  });
  syncOrderModeAddress(checkoutForm);

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lines = getLines();
    if (lines.length === 0) {
      alert("Adicione itens ao carrinho.");
      return;
    }
    const fd = new FormData(e.target);
    const orderMode = String(fd.get("orderMode") || "").trim();
    const customer = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      orderMode,
      street: String(fd.get("street") || "").trim(),
      number: String(fd.get("number") || "").trim(),
      neighborhood: String(fd.get("neighborhood") || "").trim(),
      payment: String(fd.get("payment") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
    };
    if (!customer.name || !customer.phone || !customer.orderMode || !customer.payment) {
      alert("Preencha nome, telefone, tipo de pedido e forma de pagamento.");
      return;
    }
    if (customer.orderMode === "delivery") {
      if (!customer.street || !customer.number || !customer.neighborhood) {
        alert("Para entrega, preencha rua, número e bairro completos.");
        return;
      }
    }
    let data;
    try {
      data = await loadMenuData();
    } catch {
      alert("Erro ao carregar dados da loja.");
      return;
    }
    const store = data.store || {};

    if (customer.payment === "Cartão online" && (store.paymentCardLink || "").trim()) {
      window.open(String(store.paymentCardLink).trim(), "_blank", "noopener,noreferrer");
    }

    const orderNumber = generateOrderNumber();
    openWhatsappOrder({
      whatsappDigits: store.whatsapp || "5511999999999",
      text: buildWhatsappText({
        name: store.name || "Point do Roger",
        store,
        lines,
        customer,
        orderNumber,
      }),
    });
    clearCart();
    render();
    showOrderThanks();
  });
}

function showOrderThanks() {
  const el = document.getElementById("order-thanks");
  if (!el) return;
  el.classList.remove("hidden");
  document.body.classList.add("order-thanks-open");
}

loadMenuData()
  .then((data) => {
    applyPaymentHints(data.store || {});
    setupPixCopy();
    render();
  })
  .catch(() => {
    render();
  });

window.addEventListener("cardapio-cart-updated", render);
