const STORAGE_PREVIEW = "cardapio_menu_preview_v1";

export async function loadMenuData() {
  try {
    const prev = localStorage.getItem(STORAGE_PREVIEW);
    if (prev) return JSON.parse(prev);
  } catch (e) {}
  const res = await fetch("data/menu-data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o cardápio.");
  return res.json();
}
