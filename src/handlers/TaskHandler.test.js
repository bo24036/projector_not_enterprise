// Polyfill for Node.js (only reached if dispatch is called, which handler tests avoid)
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

import '../handlers/TaskHandler.js';
import { _getHandlerForTesting } from '../state.js';
import * as Task from '../domains/Task.js';

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
  taskFormKey: 0,
  creatingPerson: false,
  editingPersonId: null,
  creatingNote: false,
  editingNoteId: null,
  showSettingsModal: false,
  lastError: null,
};

// --- CREATE_TASK ---
console.log('\n=== CREATE_TASK ===');
Task._resetCacheForTesting();

const createTask = _getHandlerForTesting('CREATE_TASK');

const createResult = createTask(BASE_STATE, { type: 'CREATE_TASK', payload: { projectId: 'proj_1', name: 'New Task', dueDate: null } });
assertEqual(createResult.state.creatingTask, true, 'CREATE_TASK: keeps creatingTask true on success (form stays open)');
assertEqual(createResult.state.taskFormKey, 1, 'CREATE_TASK: increments taskFormKey on success');
assertEqual(createResult.state.lastError, null, 'CREATE_TASK: no error on success');
assert(Task.getTasksByProjectId('proj_1').length === 1, 'CREATE_TASK: task added to domain cache');

const createErrorResult = createTask(BASE_STATE, { type: 'CREATE_TASK', payload: { projectId: 'proj_1', name: '', dueDate: null } });
assert(createErrorResult.state.lastError !== null, 'CREATE_TASK: sets lastError on empty name');
assertEqual(createErrorResult.state.lastError.actionType, 'CREATE_TASK', 'CREATE_TASK: lastError.actionType correct');

// --- UPDATE_TASK ---
console.log('\n=== UPDATE_TASK ===');
Task._resetCacheForTesting();

const updateTask = _getHandlerForTesting('UPDATE_TASK');
const task = Task.createTask('proj_1', 'Original', null);

const updateResult = updateTask({ ...BASE_STATE, editingTaskId: task.id }, { type: 'UPDATE_TASK', payload: { taskId: task.id, name: 'Updated' } });
assertEqual(updateResult.state.editingTaskId, null, 'UPDATE_TASK: clears editingTaskId on success');
assertEqual(Task.getTask(task.id).name, 'Updated', 'UPDATE_TASK: task name updated in cache');

const updateErrorResult = updateTask(BASE_STATE, { type: 'UPDATE_TASK', payload: { taskId: 'nonexistent', name: 'x' } });
assert(updateErrorResult.state.lastError !== null, 'UPDATE_TASK: sets lastError for unknown task');
assertEqual(updateErrorResult.state.lastError.actionType, 'UPDATE_TASK', 'UPDATE_TASK: lastError.actionType correct');

// --- DELETE_TASK ---
console.log('\n=== DELETE_TASK ===');
Task._resetCacheForTesting();

const deleteTask = _getHandlerForTesting('DELETE_TASK');
const taskToDelete = Task.createTask('proj_1', 'Delete Me', null);

const deleteResult = deleteTask(BASE_STATE, { type: 'DELETE_TASK', payload: { taskId: taskToDelete.id } });
assertEqual(deleteResult.state.lastError, null, 'DELETE_TASK: no error on success');
assertEqual(Task.getTask(taskToDelete.id), undefined, 'DELETE_TASK: task removed from cache');

const deleteErrorResult = deleteTask(BASE_STATE, { type: 'DELETE_TASK', payload: { taskId: 'nonexistent' } });
assert(deleteErrorResult.state.lastError !== null, 'DELETE_TASK: sets lastError for unknown task');

// --- TOGGLE_TASK_COMPLETED ---
console.log('\n=== TOGGLE_TASK_COMPLETED ===');
Task._resetCacheForTesting();

const toggleTask = _getHandlerForTesting('TOGGLE_TASK_COMPLETED');
const toggleable = Task.createTask('proj_1', 'Toggle Me', null);
assert(toggleable.completed === false, 'TOGGLE_TASK_COMPLETED: starts incomplete');

toggleTask(BASE_STATE, { type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: toggleable.id } });
assert(Task.getTask(toggleable.id).completed === true, 'TOGGLE_TASK_COMPLETED: marks task complete');

toggleTask(BASE_STATE, { type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: toggleable.id } });
assert(Task.getTask(toggleable.id).completed === false, 'TOGGLE_TASK_COMPLETED: toggles back to incomplete');

const toggleErrorResult = toggleTask(BASE_STATE, { type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: 'nonexistent' } });
assert(toggleErrorResult.state.lastError !== null, 'TOGGLE_TASK_COMPLETED: sets lastError for unknown task');

// --- START/CANCEL_CREATE_TASK ---
console.log('\n=== START/CANCEL_CREATE_TASK ===');

const startCreate = _getHandlerForTesting('START_CREATE_TASK');
const cancelCreate = _getHandlerForTesting('CANCEL_CREATE_TASK');

assertEqual(startCreate(BASE_STATE).state.creatingTask, true, 'START_CREATE_TASK: sets creatingTask to true');
assertEqual(cancelCreate({ ...BASE_STATE, creatingTask: true }).state.creatingTask, false, 'CANCEL_CREATE_TASK: sets creatingTask to false');

// --- START/CANCEL_EDIT_TASK ---
console.log('\n=== START/CANCEL_EDIT_TASK ===');
Task._resetCacheForTesting();

const startEdit = _getHandlerForTesting('START_EDIT_TASK');
const cancelEdit = _getHandlerForTesting('CANCEL_EDIT_TASK');
const editableTask = Task.createTask('proj_1', 'Editable', null);

const startEditResult = startEdit(BASE_STATE, { type: 'START_EDIT_TASK', payload: { taskId: editableTask.id } });
assertEqual(startEditResult.state.editingTaskId, editableTask.id, 'START_EDIT_TASK: sets editingTaskId');

const cancelEditResult = cancelEdit({ ...BASE_STATE, editingTaskId: editableTask.id });
assertEqual(cancelEditResult.state.editingTaskId, null, 'CANCEL_EDIT_TASK: clears editingTaskId');

const startEditMissResult = startEdit(BASE_STATE, { type: 'START_EDIT_TASK', payload: { taskId: 'nonexistent' } });
assertEqual(startEditMissResult.state.editingTaskId, null, 'START_EDIT_TASK: no-op for unknown task');

// --- SELECT_PERSONAL_TASKS ---
console.log('\n=== SELECT_PERSONAL_TASKS ===');

const selectPersonal = _getHandlerForTesting('SELECT_PERSONAL_TASKS');
const personalResult = selectPersonal({ ...BASE_STATE, currentPage: 'project', currentProjectId: 'proj_1' });
assertEqual(personalResult.state.currentPage, 'personal', 'SELECT_PERSONAL_TASKS: sets currentPage to personal');
assertEqual(personalResult.state.currentProjectId, null, 'SELECT_PERSONAL_TASKS: clears currentProjectId');

// --- Summary ---
console.log(`\n=== Summary ===`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
if (testsFailed > 0) process.exit(1);
