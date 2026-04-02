const AUTO_DISMISS_MS = 5000;

const state = {
  // currentPage values: 'overview' | 'personal' | 'readingList' | 'project' | 'yearEndReport'
  currentPage: 'overview',
  currentProjectId: null,
  isCreatingProject: false,
  showArchivedProjects: false,
  creatingTask: false,
  editingTaskId: null,
  creatingPerson: false,
  editingPersonId: null,
  creatingNote: false,
  editingNoteId: null,
  creatingReadingListItem: false,
  editingReadingListItemId: null,
  showReadingListRead: false,
  readingListSearch: '',
  showSettingsModal: false,
  restoringProjectId: null,
  lastError: null, // { actionType, message, entityId, timestamp } - cleared when dismissed or on next action
  updateAvailable: false,
  yearEndReportYear: new Date().getFullYear() - 1,
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
    // Skip render if handler returned the same state reference (true no-op, e.g. *_LOADED
    // handlers that only update the domain cache). This prevents mid-edit re-renders from
    // async IDB fetches completing while the user is typing in an inline form.
    if (nextState !== state) setState(nextState);

    effects?.forEach(effect => {
      queueMicrotask(effect);
    });
  } catch (error) {
    console.error(`Handler error for action ${action.type}:`, error.message);
    // Dispatch error action to notify user and allow recovery
    dispatch({ type: 'SET_ERROR', payload: { actionType: action.type, message: error.message } });
  }
}

const handlers = {};

export function registerHandler(actionType, handler) {
  handlers[actionType] = handler;
}

// Test utility — exposes registered handlers for direct invocation in tests
export function _getHandlerForTesting(actionType) {
  return handlers[actionType];
}

export function getHandlerKeys() {
  return Object.keys(handlers);
}

// Error handling
registerHandler('SET_ERROR', (state, action) => {
  const { actionType, message, entityId } = action.payload;
  console.error(`[${actionType}]`, message);
  const error = {
    actionType,
    message,
    entityId,
    timestamp: Date.now(),
  };

  // Return effect that auto-dismisses error after 5 seconds
  // Only clears if it's still the same error (prevents clearing newer errors)
  const autoDismissEffect = () => {
    setTimeout(() => {
      const currentState = getState();
      if (currentState.lastError?.timestamp === error.timestamp) {
        dispatch({ type: 'CLEAR_ERROR' });
      }
    }, AUTO_DISMISS_MS);
  };

  return {
    state: { ...state, lastError: error },
    effects: [autoDismissEffect],
  };
});

registerHandler('CLEAR_ERROR', (state) => {
  return { state: { ...state, lastError: null } };
});
