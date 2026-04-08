globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

import '../handlers/NoteHandler.js';
import { _getHandlerForTesting } from '../state.js';
import * as Note from '../domains/Note.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

const BASE_STATE = {
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
  noteFormKey: 0,
  showSettingsModal: false,
  lastError: null,
};

// --- CREATE_NOTE ---
console.log('\n=== CREATE_NOTE ===');
Note._resetCacheForTesting();

const createNote = _getHandlerForTesting('CREATE_NOTE');

const createResult = createNote({ ...BASE_STATE, creatingNote: true, noteFormKey: 0 }, { type: 'CREATE_NOTE', payload: { projectId: 'proj_1', content: 'First note', link: '' } });
assertEqual(createResult.state.creatingNote, true, 'CREATE_NOTE: keeps creatingNote true on success (form stays open)');
assertEqual(createResult.state.noteFormKey, 1, 'CREATE_NOTE: increments noteFormKey on success');
assertEqual(createResult.state.lastError, null, 'CREATE_NOTE: no error on success');
assert(Note.getNotesByProjectId('proj_1').length === 1, 'CREATE_NOTE: note added to domain cache');

const createErrorResult = createNote(BASE_STATE, { type: 'CREATE_NOTE', payload: { projectId: 'proj_1', content: '', link: '' } });
assert(createErrorResult.state.lastError !== null, 'CREATE_NOTE: sets lastError on empty content');
assertEqual(createErrorResult.state.lastError.actionType, 'CREATE_NOTE', 'CREATE_NOTE: lastError.actionType correct');
assertEqual(createErrorResult.state.creatingNote, false, 'CREATE_NOTE: creatingNote unchanged on error');

const noProjectResult = createNote(BASE_STATE, { type: 'CREATE_NOTE', payload: { projectId: null, content: 'x', link: '' } });
assert(noProjectResult.state.lastError !== null, 'CREATE_NOTE: sets lastError when projectId is null');

// --- UPDATE_NOTE ---
console.log('\n=== UPDATE_NOTE ===');
Note._resetCacheForTesting();

const updateNote = _getHandlerForTesting('UPDATE_NOTE');
const note = Note.createNote('proj_1', 'Original content', '');

const updateResult = updateNote({ ...BASE_STATE, editingNoteId: note.id }, { type: 'UPDATE_NOTE', payload: { noteId: note.id, content: 'Updated content', link: 'https://example.com' } });
assertEqual(updateResult.state.editingNoteId, null, 'UPDATE_NOTE: clears editingNoteId on success');
assertEqual(Note.getNote(note.id).content, 'Updated content', 'UPDATE_NOTE: content updated in cache');
assertEqual(Note.getNote(note.id).link, 'https://example.com', 'UPDATE_NOTE: link updated in cache');

const updateErrorResult = updateNote(BASE_STATE, { type: 'UPDATE_NOTE', payload: { noteId: 'nonexistent', content: 'x', link: '' } });
assert(updateErrorResult.state.lastError !== null, 'UPDATE_NOTE: sets lastError for unknown note');
assertEqual(updateErrorResult.state.lastError.actionType, 'UPDATE_NOTE', 'UPDATE_NOTE: lastError.actionType correct');

// empty content error
const emptyContentResult = updateNote(BASE_STATE, { type: 'UPDATE_NOTE', payload: { noteId: note.id, content: '', link: '' } });
assert(emptyContentResult.state.lastError !== null, 'UPDATE_NOTE: sets lastError for empty content');

// --- DELETE_NOTE ---
console.log('\n=== DELETE_NOTE ===');
Note._resetCacheForTesting();

const deleteNote = _getHandlerForTesting('DELETE_NOTE');
const noteToDelete = Note.createNote('proj_1', 'Delete me', '');

const deleteResult = deleteNote(BASE_STATE, { type: 'DELETE_NOTE', payload: { noteId: noteToDelete.id } });
assertEqual(deleteResult.state.lastError, null, 'DELETE_NOTE: no error on success');
assertEqual(Note.getNote(noteToDelete.id), undefined, 'DELETE_NOTE: note removed from cache');

const deleteErrorResult = deleteNote(BASE_STATE, { type: 'DELETE_NOTE', payload: { noteId: 'nonexistent' } });
assert(deleteErrorResult.state.lastError !== null, 'DELETE_NOTE: sets lastError for unknown note');

// --- START/CANCEL_CREATE_NOTE ---
console.log('\n=== START/CANCEL_CREATE_NOTE ===');

const startCreate = _getHandlerForTesting('START_CREATE_NOTE');
const cancelCreate = _getHandlerForTesting('CANCEL_CREATE_NOTE');
assertEqual(startCreate(BASE_STATE).state.creatingNote, true, 'START_CREATE_NOTE: sets creatingNote to true');
assertEqual(cancelCreate({ ...BASE_STATE, creatingNote: true }).state.creatingNote, false, 'CANCEL_CREATE_NOTE: sets creatingNote to false');

// --- START/CANCEL_EDIT_NOTE ---
console.log('\n=== START/CANCEL_EDIT_NOTE ===');
Note._resetCacheForTesting();

const startEdit = _getHandlerForTesting('START_EDIT_NOTE');
const cancelEdit = _getHandlerForTesting('CANCEL_EDIT_NOTE');
const editableNote = Note.createNote('proj_1', 'Editable note', '');

const startEditResult = startEdit(BASE_STATE, { type: 'START_EDIT_NOTE', payload: { noteId: editableNote.id } });
assertEqual(startEditResult.state.editingNoteId, editableNote.id, 'START_EDIT_NOTE: sets editingNoteId');

const cancelEditResult = cancelEdit({ ...BASE_STATE, editingNoteId: editableNote.id });
assertEqual(cancelEditResult.state.editingNoteId, null, 'CANCEL_EDIT_NOTE: clears editingNoteId');

const startEditMissResult = startEdit(BASE_STATE, { type: 'START_EDIT_NOTE', payload: { noteId: 'nonexistent' } });
assertEqual(startEditMissResult.state.editingNoteId, null, 'START_EDIT_NOTE: no-op for unknown note');

// --- Summary ---
console.log(`\n=== Summary ===`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
if (testsFailed > 0) process.exit(1);
