const STORAGE_KEY = "cardapio_fin_stats_v1";

function toMoney(n) {
  return Number(n) || 0;
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function incVisits(amount = 1) {
  const all = readAll();
  const k = todayKey();
  if (!all[k]) all[k] = { visits: 0, purchases: 0, revenue: 0 };
  all[k].visits = toMoney(all[k].visits) + toMoney(amount);
  writeAll(all);
}

export function addPurchase(amount) {
  const all = readAll();
  const k = todayKey();
  if (!all[k]) all[k] = { visits: 0, purchases: 0, revenue: 0 };
  all[k].purchases = toMoney(all[k].purchases) + 1;
  all[k].revenue = toMoney(all[k].revenue) + toMoney(amount);
  writeAll(all);
}

export function getStats() {
  return readAll();
}

export function clearStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

