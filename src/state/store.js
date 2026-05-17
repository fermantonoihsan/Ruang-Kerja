import { loadFromStorage, saveToStorage, storageKeys } from "../services/storage.service.js";
import { generateId, getTodayISO } from "../utils/helpers.js";

let state = null;
const listeners = new Set();

function createInitialState() {
  const firstPage = {
    id: generateId("page"),
    title: "Welcome to Atlas Workspace",
    icon: "A",
    status: "doing",
    tags: ["welcome", "workspace"],
    markdown: "# Welcome to Atlas Workspace\n\nCapture notes, organize tasks, and manage reminders from one calm workspace.",
    reminderAt: "",
    reminderDone: false,
    createdAt: getTodayISO(),
    updatedAt: getTodayISO(),
  };

  return {
    templateId: "",
    workspaceName: "My Workspace",
    displayName: "Guest",
    preferences: {
      pageZoom: 100,
      compactMode: false,
      focusCards: false,
    },
    selectedPageId: firstPage.id,
    pages: [firstPage],
    updatedAt: getTodayISO(),
  };
}

export function initStore(initialState = null) {
  state =
    initialState ||
    loadFromStorage(storageKeys.workspace, null) ||
    createInitialState();

  notify();
  return state;
}

export function getState() {
  if (!state) {
    return initStore();
  }

  return state;
}

export function saveState() {
  const currentState = getState();
  currentState.updatedAt = getTodayISO();
  saveToStorage(storageKeys.workspace, currentState);
  notify();
  return currentState;
}

export function setState(nextState = {}) {
  state = {
    ...getState(),
    ...nextState,
    updatedAt: getTodayISO(),
  };

  saveToStorage(storageKeys.workspace, state);
  notify();
  return state;
}

export function replaceState(nextState) {
  state = {
    ...nextState,
    updatedAt: nextState?.updatedAt || getTodayISO(),
  };

  saveToStorage(storageKeys.workspace, state);
  notify();
  return state;
}

export function selectedPage() {
  const currentState = getState();
  return (
    currentState.pages.find((page) => page.id === currentState.selectedPageId) ||
    currentState.pages[0] ||
    null
  );
}

export function subscribe(listener) {
  if (typeof listener !== "function") {
    throw new Error("Store listener must be a function.");
  }

  listeners.add(listener);

  return function unsubscribe() {
    listeners.delete(listener);
  };
}

export function dispatch(action) {
  if (!action || !action.type) {
    throw new Error("Action must have a type.");
  }

  switch (action.type) {
    case "workspace/replace":
      return replaceState(action.payload);

    case "workspace/patch":
      return setState(action.payload);

    default:
      console.warn(`[store] Unknown action type: ${action.type}`);
      return getState();
  }
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(getState());
    } catch (error) {
      console.error("[store] Listener error:", error);
    }
  });
}
