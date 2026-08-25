const KEY = "dynova_compare_product_ids";
const MAX = 4;

export function getCompareIds() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addCompareId(productId) {
  const id = Number(productId);
  if (!Number.isFinite(id)) return getCompareIds();
  const current = getCompareIds().filter((x) => x !== id);
  const next = [...current, id].slice(-MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("dynova:compare"));
  return next;
}

export function removeCompareId(productId) {
  const id = Number(productId);
  const next = getCompareIds().filter((x) => x !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("dynova:compare"));
  return next;
}

export function clearCompare() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("dynova:compare"));
}
