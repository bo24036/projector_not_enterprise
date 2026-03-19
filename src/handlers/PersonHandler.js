import * as Person from '../domains/Person.js';
import * as Settings from '../domains/Settings.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createEditHandlers, createNoOpLoadedHandler } from '../utils/handlerFactory.js';

registerHandler('CREATE_PERSON', (state, action) => {
  const { projectId, name, role } = action.payload;

  try {
    Person.createPerson(projectId, name, role);
    return { state: { ...state, creatingPerson: false } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'CREATE_PERSON',
          message: error.message,
          entityId: projectId,
          timestamp: Date.now(),
        },
      },
    };
  }
});

registerHandler('UPDATE_PERSON', (state, action) => {
  const { personId, name, role } = action.payload;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;

  try {
    Person.updatePerson(personId, updates);
    return { state: { ...state, editingPersonId: null } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'UPDATE_PERSON',
          message: error.message,
          entityId: personId,
          timestamp: Date.now(),
        },
      },
    };
  }
});

registerHandler('DELETE_PERSON', (state, action) => {
  const { personId } = action.payload;

  try {
    Person.deletePerson(personId);
    return { state };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'DELETE_PERSON',
          message: error.message,
          entityId: personId,
          timestamp: Date.now(),
        },
      },
    };
  }
});

// Create START_CREATE_PERSON and CANCEL_CREATE_PERSON handlers
createToggleCreateHandler('PERSON', 'creatingPerson');

// Create START_EDIT_PERSON and CANCEL_EDIT_PERSON handlers
createEditHandlers('PERSON', {
  getter: Person.getPerson,
  idPayloadKey: 'personId',
  stateIdKey: 'editingPersonId',
});

// Create no-op handler that triggers re-render when person is loaded
createNoOpLoadedHandler('PERSON_LOADED');

// Settings modal handlers
registerHandler('OPEN_SETTINGS_MODAL', (state) => {
  return { state: { ...state, showSettingsModal: true } };
});

registerHandler('CLOSE_SETTINGS_MODAL', (state) => {
  return { state: { ...state, showSettingsModal: false } };
});

registerHandler('UPDATE_HOLD_REVIEW_DAYS', (state, action) => {
  Settings.setHoldReviewDays(action.payload.days);
  return { state };
});

registerHandler('UPDATE_SUPPRESSED_NAMES', (state, action) => {
  try {
    Person.setSuppressedNames(action.payload.names);
    return { state: { ...state, showSettingsModal: false } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'UPDATE_SUPPRESSED_NAMES',
          message: error.message,
          timestamp: Date.now(),
        },
      },
    };
  }
});
