const STORAGE_KEY = "cardapio_cart_v1";

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch (e) {
    return [];
  }
}

function writeRaw(lines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  try {
    window.dispatchEvent(new CustomEvent("cardapio-cart-updated"));
  } catch (e) {}
}

function lineKey(catId, itemId) {
  return `${catId}::${itemId}`;
}

export function getLines() {
  return readRaw();
}

export function getItemCount() {
  return readRaw().reduce((s, L) => s + (L.qty || 0), 0);
}

export function getSubtotal() {
  return readRaw().reduce(
    (s, L) => s + (Number(L.price) || 0) * (L.qty || 0),
    0
  );
}

export function addItem({ catId, catTitle, item }) {
  const lines = readRaw();
  const key = lineKey(catId, item.id);
  const i = lines.findIndex((L) => L.key === key);
  if (i >= 0) lines[i].qty = (lines[i].qty || 0) + 1;
  else
    lines.push({
      key,
      catId,
      catTitle: catTitle || "",
      itemId: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      qty: 1,
    });
  writeRaw(lines);
}

export function setQty(key, qty) {
  const q = Math.max(0, parseInt(String(qty), 10) || 0);
  let lines = readRaw();
  const i = lines.findIndex((L) => L.key === key);
  if (i < 0) return;
  if (q === 0) lines.splice(i, 1);
  else lines[i].qty = q;
  writeRaw(lines);
}

export function removeLine(key) {
  writeRaw(readRaw().filter((L) => L.key !== key));
}

export function clearCart() {
  writeRaw([]);
}

export function formatMoney(n) {
  return Number(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function buildWhatsappText({ name, store, lines, customer }) {
  const storeName = name || "Cardápio Digital";
  const waLines = (lines || [])
    .map((L) => {
      const sub = (Number(L.price) || 0) * (L.qty || 0);
      return `• ${L.qty}x ${L.name} — ${formatMoney(sub)}`;
    })
    .join("\n");
  const total = (lines || []).reduce(
    (s, L) => s + (Number(L.price) || 0) * (L.qty || 0),
    0
  );
  let t = `*Pedido — ${storeName}*\n\n`;
  t += `*Cliente:* ${customer.name || "-"}\n`;
  t += `*Telefone:* ${customer.phone || "-"}\n`;
  t += `*Endereço:* ${customer.address || "-"}\n`;
  t += `*Pagamento:* ${customer.payment || "-"}\n\n`;
  t += `*Itens:*\n${waLines || "(nenhum)"}\n\n`;
  t += `*Total:* ${formatMoney(total)}\n`;
  const notes = (customer.notes || "").trim();
  if (notes) t += `\n_Observações:_ ${notes}`;
  return t;
}

export function openWhatsappOrder({ whatsappDigits, text }) {
  const wa =
    String(whatsappDigits || "").replace(/\D/g, "") || "5511999999999";
  window.open(
    `https://wa.me/${wa}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
