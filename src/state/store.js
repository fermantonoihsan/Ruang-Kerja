let state = {};
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(nextState) {
  state = {
    ...state,
    ...nextState,
    updatedAt: new Date().toISOString()
  };

  notify();
  return state;
}

export function replaceState(nextState) {
  state = {
    ...nextState,
    updatedAt: nextState?.updatedAt || new Date().toISOString()
  };

  notify();
  return state;
}

export function subscribe(listener) {
  if (typeof listener !== "function") {
    throw new Error("Store listener harus berupa function.");
  }

  listeners.add(listener);

  return function unsubscribe() {
    listeners.delete(listener);
  };
}

export function dispatch(action) {
  if (!action || !action.type) {
    throw new Error("Action harus memiliki type.");
  }

  switch (action.type) {
    case "workspace/replace":
      return replaceState(action.payload);

    case "workspace/patch":
      return setState(action.payload);

    default:
      console.warn(`[store] Unknown action type: ${action.type}`);
      return state;
  }
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error("[store] Listener error:", error);
    }
  });
}