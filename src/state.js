const state = {
  currentProjectId: null,
  isCreatingProject: false,
};

const watchers = new Map();
let renderScheduled = false;
let pendingStateUpdates = {};

function setState(updates) {
  // Collect updates without applying yet
  Object.assign(pendingStateUpdates, updates);

  // If render already scheduled, all pending updates will be applied in the next frame
  if (renderScheduled) {
    return;
  }

  // Schedule render for next animation frame
  renderScheduled = true;
  requestAnimationFrame(() => {
    // Apply all collected updates at once
    Object.assign(state, pendingStateUpdates);
    pendingStateUpdates = {};
    renderScheduled = false;

    // Notify watchers after all updates applied
    notifyWatchers();
  });
}

export function watch(key, callback) {
  if (!watchers.has(key)) {
    watchers.set(key, new Set());
  }
  watchers.get(key).add(callback);

  return () => {
    watchers.get(key).delete(callback);
  };
}

function notifyWatchers() {
  for (const [key, callbacks] of watchers.entries()) {
    callbacks.forEach(callback => callback(state[key]));
  }
}

export function dispatch(action) {
  const handler = handlers[action.type];
  if (!handler) {
    console.error(`Unknown action type: ${action.type}`);
    return;
  }

  const { state: nextState, effects } = handler(state, action);
  setState(nextState);

  effects?.forEach(effect => {
    queueMicrotask(effect);
  });
}

const handlers = {};

export function registerHandler(actionType, handler) {
  handlers[actionType] = handler;
}
