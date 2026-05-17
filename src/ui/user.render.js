const $ = (id) => document.getElementById(id);

const statusLabels = {
  local: "Local workspace",
  "login-required": "Login to sync",
  connecting: "Connecting...",
  "cloud-ready": "Cloud ready",
  syncing: "Syncing...",
  synced: "Synced",
  error: "Sync error",
};

const statusClasses = [
  "local",
  "login-required",
  "synced",
  "syncing",
  "error",
  "cloud-ready",
  "connecting",
];

export function renderUser({ user = null, syncStatus = "local", guestName = "Guest" } = {}) {
  const displayName = user?.displayName || user?.email || "User";
  const email = user?.email || "Cloud workspace";
  const avatar = (displayName || email || "G").trim().slice(0, 1).toUpperCase() || "G";
  const localName = guestName || "Guest";
  const normalizedStatus = statusLabels[syncStatus] ? syncStatus : "local";

  if ($("userName")) $("userName").textContent = user ? displayName : localName;
  if ($("userEmail")) $("userEmail").textContent = user ? email : "Offline-first workspace";
  if ($("userAvatar")) $("userAvatar").textContent = user ? avatar : localName.trim().slice(0, 1).toUpperCase() || "G";

  if ($("authButton")) {
    const label = $("authButton").querySelector("span");
    if (label) label.textContent = user ? "Logout" : "Login";
  }

  if ($("syncStatusBadge")) {
    $("syncStatusBadge").textContent = statusLabels[normalizedStatus];
    $("syncStatusBadge").classList.remove(...statusClasses);
    $("syncStatusBadge").classList.add(normalizedStatus);
  }
}
