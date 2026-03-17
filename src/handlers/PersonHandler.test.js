globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

import '../handlers/PersonHandler.js';
import { _getHandlerForTesting } from '../state.js';
import * as Person from '../domains/Person.js';

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
  showSuppressNamesModal: false,
  lastError: null,
};

// --- CREATE_PERSON ---
console.log('\n=== CREATE_PERSON ===');
Person._resetCacheForTesting();

const createPerson = _getHandlerForTesting('CREATE_PERSON');

const createResult = createPerson({ ...BASE_STATE, creatingPerson: true }, { type: 'CREATE_PERSON', payload: { projectId: 'proj_1', name: 'Alice', role: 'PM' } });
assertEqual(createResult.state.creatingPerson, false, 'CREATE_PERSON: resets creatingPerson on success');
assertEqual(createResult.state.lastError, null, 'CREATE_PERSON: no error on success');
assert(Person.getPeopleByProjectId('proj_1').length === 1, 'CREATE_PERSON: person in domain cache');

const createErrorResult = createPerson(BASE_STATE, { type: 'CREATE_PERSON', payload: { projectId: 'proj_1', name: '', role: '' } });
assert(createErrorResult.state.lastError !== null, 'CREATE_PERSON: sets lastError on empty name');
assertEqual(createErrorResult.state.lastError.actionType, 'CREATE_PERSON', 'CREATE_PERSON: lastError.actionType correct');

// --- UPDATE_PERSON ---
console.log('\n=== UPDATE_PERSON ===');
Person._resetCacheForTesting();

const updatePerson = _getHandlerForTesting('UPDATE_PERSON');
const person = Person.createPerson('proj_1', 'Bob', 'Dev');

const updateResult = updatePerson({ ...BASE_STATE, editingPersonId: person.id }, { type: 'UPDATE_PERSON', payload: { personId: person.id, name: 'Robert', role: 'Lead Dev' } });
assertEqual(updateResult.state.editingPersonId, null, 'UPDATE_PERSON: clears editingPersonId on success');
assertEqual(Person.getPerson(person.id).name, 'Robert', 'UPDATE_PERSON: name updated in cache');
assertEqual(Person.getPerson(person.id).role, 'Lead Dev', 'UPDATE_PERSON: role updated in cache');

const updateErrorResult = updatePerson(BASE_STATE, { type: 'UPDATE_PERSON', payload: { personId: 'nonexistent', name: 'x' } });
assert(updateErrorResult.state.lastError !== null, 'UPDATE_PERSON: sets lastError for unknown person');

// --- DELETE_PERSON ---
console.log('\n=== DELETE_PERSON ===');
Person._resetCacheForTesting();

const deletePerson = _getHandlerForTesting('DELETE_PERSON');
const personToDelete = Person.createPerson('proj_1', 'Carol', 'QA');

const deleteResult = deletePerson(BASE_STATE, { type: 'DELETE_PERSON', payload: { personId: personToDelete.id } });
assertEqual(deleteResult.state.lastError, null, 'DELETE_PERSON: no error on success');
assertEqual(Person.getPerson(personToDelete.id), undefined, 'DELETE_PERSON: person removed from cache');

const deleteErrorResult = deletePerson(BASE_STATE, { type: 'DELETE_PERSON', payload: { personId: 'nonexistent' } });
assert(deleteErrorResult.state.lastError !== null, 'DELETE_PERSON: sets lastError for unknown person');

// --- START/CANCEL_CREATE_PERSON ---
console.log('\n=== START/CANCEL_CREATE_PERSON ===');

const startCreate = _getHandlerForTesting('START_CREATE_PERSON');
const cancelCreate = _getHandlerForTesting('CANCEL_CREATE_PERSON');
assertEqual(startCreate(BASE_STATE).state.creatingPerson, true, 'START_CREATE_PERSON: sets creatingPerson to true');
assertEqual(cancelCreate({ ...BASE_STATE, creatingPerson: true }).state.creatingPerson, false, 'CANCEL_CREATE_PERSON: sets creatingPerson to false');

// --- START/CANCEL_EDIT_PERSON ---
console.log('\n=== START/CANCEL_EDIT_PERSON ===');
Person._resetCacheForTesting();

const startEdit = _getHandlerForTesting('START_EDIT_PERSON');
const cancelEdit = _getHandlerForTesting('CANCEL_EDIT_PERSON');
const editablePerson = Person.createPerson('proj_1', 'Dave', 'Designer');

const startEditResult = startEdit(BASE_STATE, { type: 'START_EDIT_PERSON', payload: { personId: editablePerson.id } });
assertEqual(startEditResult.state.editingPersonId, editablePerson.id, 'START_EDIT_PERSON: sets editingPersonId');

const cancelEditResult = cancelEdit({ ...BASE_STATE, editingPersonId: editablePerson.id });
assertEqual(cancelEditResult.state.editingPersonId, null, 'CANCEL_EDIT_PERSON: clears editingPersonId');

const startEditMissResult = startEdit(BASE_STATE, { type: 'START_EDIT_PERSON', payload: { personId: 'nonexistent' } });
assertEqual(startEditMissResult.state.editingPersonId, null, 'START_EDIT_PERSON: no-op for unknown person');

// --- OPEN/CLOSE_SUPPRESS_NAMES_MODAL ---
console.log('\n=== SUPPRESS_NAMES_MODAL ===');

const openModal = _getHandlerForTesting('OPEN_SUPPRESS_NAMES_MODAL');
const closeModal = _getHandlerForTesting('CLOSE_SUPPRESS_NAMES_MODAL');
assertEqual(openModal(BASE_STATE).state.showSuppressNamesModal, true, 'OPEN_SUPPRESS_NAMES_MODAL: sets showSuppressNamesModal to true');
assertEqual(closeModal({ ...BASE_STATE, showSuppressNamesModal: true }).state.showSuppressNamesModal, false, 'CLOSE_SUPPRESS_NAMES_MODAL: sets showSuppressNamesModal to false');

// --- Summary ---
console.log(`\n=== Summary ===`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
if (testsFailed > 0) process.exit(1);
