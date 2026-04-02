import { getItemCount } from "./cart.js";

function updateBadge() {
  document.querySelectorAll("#cart-badge").forEach((el) => {
    const n = getItemCount();
    el.textContent = String(n);
    el.classList.toggle("is-empty", n === 0);
  });
  document.querySelectorAll("[data-cart-fab]").forEach((fab) => {
    const n = getItemCount();
    fab.hidden = n === 0;
    const label = fab.querySelector("[data-cart-fab-count]");
    if (label) label.textContent = String(n);
  });
}

export function initCartBadge() {
  updateBadge();
  window.addEventListener("cardapio-cart-updated", updateBadge);
}
