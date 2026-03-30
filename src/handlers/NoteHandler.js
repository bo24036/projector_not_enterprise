import * as Note from '../domains/Note.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createEditHandlers, createNoOpLoadedHandler, createMutationHandler } from '../utils/handlerFactory.js';

registerHandler('CREATE_NOTE', (state, action) => {
  const { projectId, content, link } = action.payload;

  try {
    Note.createNote(projectId, content, link);
    return { state: { ...state, creatingNote: true, creatingNoteContent: '', creatingNoteLink: '' } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'CREATE_NOTE',
          message: error.message,
          timestamp: Date.now(),
        },
      },
    };
  }
});

registerHandler('UPDATE_NOTE', (state, action) => {
  const { noteId, content, link } = action.payload;

  try {
    Note.updateNote(noteId, { content, link });
    return { state: { ...state, editingNoteId: null } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'UPDATE_NOTE',
          message: error.message,
          timestamp: Date.now(),
        },
      },
    };
  }
});

createMutationHandler('DELETE_NOTE', ({ noteId }) => {
  Note.deleteNote(noteId);
});

// Create START_CREATE_NOTE and CANCEL_CREATE_NOTE handlers
createToggleCreateHandler('NOTE', 'creatingNote');

// Create START_EDIT_NOTE and CANCEL_EDIT_NOTE handlers
createEditHandlers('NOTE', {
  getter: Note.getNote,
  idPayloadKey: 'noteId',
  stateIdKey: 'editingNoteId',
});

// Create no-op handler that triggers re-render when notes are loaded from IDB
createNoOpLoadedHandler('NOTE_LOADED');
