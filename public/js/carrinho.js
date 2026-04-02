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
} from "./cart.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
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

document.getElementById("checkout-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const lines = getLines();
  if (lines.length === 0) {
    alert("Adicione itens ao carrinho.");
    return;
  }
  const fd = new FormData(e.target);
  const customer = {
    name: String(fd.get("name") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    address: String(fd.get("address") || "").trim(),
    payment: String(fd.get("payment") || "").trim(),
    notes: String(fd.get("notes") || "").trim(),
  };
  if (!customer.name || !customer.phone || !customer.address || !customer.payment) {
    alert("Preencha nome, telefone, endereço e pagamento.");
    return;
  }
  let data;
  try {
    data = await loadMenuData();
  } catch {
    alert("Erro ao carregar dados da loja.");
    return;
  }
  const store = data.store || {};
  openWhatsappOrder({
    whatsappDigits: store.whatsapp || "5511999999999",
    text: buildWhatsappText({
      name: store.name || "Cardápio Digital",
      store,
      lines,
      customer,
    }),
  });
  clearCart();
  render();
});

render();
window.addEventListener("cardapio-cart-updated", render);
