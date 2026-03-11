const state = {
  currentPage: 'overview',
  currentProjectId: null,
  isCreatingProject: false,
  showArchivedProjects: false,
  creatingTask: false,
  editingTaskId: null,
  editingTaskName: '',
  editingTaskDueDate: '',
};

let renderScheduled = false;
let pendingStateUpdates = {};
let rootRenderer = null;

export function getState() {
  return state;
}

export function setRootRenderer(fn) {
  rootRenderer = fn;
}

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

    // Call root renderer after state is updated
    if (rootRenderer) {
      rootRenderer();
    }
  });
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
