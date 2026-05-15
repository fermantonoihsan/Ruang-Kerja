const DEFAULT_STORAGE_KEY = "atlas_workspace_state_v2";

export function loadFromStorage(storageKey = DEFAULT_STORAGE_KEY, fallbackValue = null) {
  try {
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    console.error("[storage.service] Failed to load state:", error);
    return fallbackValue;
  }
}

export function saveToStorage(storageKey = DEFAULT_STORAGE_KEY, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("[storage.service] Failed to save state:", error);
    return false;
  }
}

export function removeFromStorage(storageKey = DEFAULT_STORAGE_KEY) {
  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error("[storage.service] Failed to remove state:", error);
    return false;
  }
}

export function hasStorageValue(storageKey = DEFAULT_STORAGE_KEY) {
  return localStorage.getItem(storageKey) !== null;
}

export const storageKeys = {
  workspace: DEFAULT_STORAGE_KEY,
  cloudConfig: "atlas-cloud-config",
  activeView: "atlas-active-view",
  theme: "atlas-theme"
};