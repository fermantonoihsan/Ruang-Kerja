export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function formatDate(dateValue, locale = "id-ID") {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function formatRelativeDate(dateValue) {
  const date = new Date(dateValue);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "baru saja";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

export function debounce(callback, delay = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getTodayISO() {
  return new Date().toISOString();
}

export function sortByUpdatedAt(items = []) {
  return [...items].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

export function groupBy(items = [], keyOrGetter) {
  const getKey = typeof keyOrGetter === "function" ? keyOrGetter : (item) => item?.[keyOrGetter];
  return items.reduce((groups, item) => {
    const key = getKey(item) ?? "";
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});
}
export function parseTags(value = "") {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function stringifyTags(tags = []) {
  if (!Array.isArray(tags)) return "";
  return tags.join(", ");
}

export function sortByPosition(items = []) {
  return [...items].sort((a, b) => {
    const positionA = Number.isFinite(a?.position) ? a.position : 0;
    const positionB = Number.isFinite(b?.position) ? b.position : 0;
    return positionA - positionB;
  });
}

export function isDueSoon(dateValue, days = 7) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);

  return date >= now && date <= limit;
}

export function safeQuerySelector(selector, root = document) {
  return root.querySelector(selector);
}

export function safeQuerySelectorAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}