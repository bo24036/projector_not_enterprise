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
  // Synchronously apply updates to state so effects and subsequent handlers see updated values
  Object.assign(state, updates);

  // Collect updates for batched render scheduling
  Object.assign(pendingStateUpdates, updates);

  // If render already scheduled, all pending updates will be applied in the next frame
  if (renderScheduled) {
    return;
  }

  // Schedule render for next animation frame
  renderScheduled = true;
  requestAnimationFrame(() => {
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

  try {
    const { state: nextState, effects } = handler(state, action);
    setState(nextState);

    effects?.forEach(effect => {
      queueMicrotask(effect);
    });
  } catch (error) {
    console.error(`Handler error for action ${action.type}:`, error.message);
    // Dispatch error action to allow UI to recover or notify user
    if (handlers['HANDLER_ERROR']) {
      dispatch({ type: 'HANDLER_ERROR', payload: { actionType: action.type, error: error.message } });
    }
  }
}

const handlers = {};

export function registerHandler(actionType, handler) {
  handlers[actionType] = handler;
}
