globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

import '../handlers/ProjectHandler.js';
import { _getHandlerForTesting } from '../state.js';
import * as Project from '../domains/Project.js';

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

// --- CREATE_PROJECT ---
console.log('\n=== CREATE_PROJECT ===');
Project._resetCacheForTesting();

const createProject = _getHandlerForTesting('CREATE_PROJECT');

const createResult = createProject({ ...BASE_STATE, isCreatingProject: true }, { type: 'CREATE_PROJECT', payload: { name: 'Alpha' } });
assertEqual(createResult.state.isCreatingProject, false, 'CREATE_PROJECT: resets isCreatingProject on success');
assert(createResult.state.currentProjectId !== null, 'CREATE_PROJECT: sets currentProjectId to new project id');
assert(Project.getProject(createResult.state.currentProjectId) !== undefined, 'CREATE_PROJECT: project in cache');

const createErrorResult = createProject(BASE_STATE, { type: 'CREATE_PROJECT', payload: { name: '' } });
assert(createErrorResult.state.lastError !== null, 'CREATE_PROJECT: sets lastError on empty name');
assertEqual(createErrorResult.state.lastError.actionType, 'CREATE_PROJECT', 'CREATE_PROJECT: lastError.actionType correct');

// Duplicate name
const dupResult = createProject(BASE_STATE, { type: 'CREATE_PROJECT', payload: { name: 'Alpha' } });
assert(dupResult.state.lastError !== null, 'CREATE_PROJECT: sets lastError on duplicate name');

// --- SELECT_PROJECT ---
console.log('\n=== SELECT_PROJECT ===');
Project._resetCacheForTesting();

const selectProject = _getHandlerForTesting('SELECT_PROJECT');
const activeProject = Project.createProject({ name: 'Active' });
const archivedProject = Project.createProject({ name: 'Archived' });
Project.archiveProject(archivedProject.id);

const selectResult = selectProject(BASE_STATE, { type: 'SELECT_PROJECT', payload: { projectId: activeProject.id } });
assertEqual(selectResult.state.currentPage, 'project', 'SELECT_PROJECT: sets currentPage to project');
assertEqual(selectResult.state.currentProjectId, activeProject.id, 'SELECT_PROJECT: sets currentProjectId');
assertEqual(selectResult.state.showArchivedProjects, false, 'SELECT_PROJECT: does not expand archived for active project');

const selectArchivedResult = selectProject({ ...BASE_STATE, showArchivedProjects: false }, { type: 'SELECT_PROJECT', payload: { projectId: archivedProject.id } });
assertEqual(selectArchivedResult.state.showArchivedProjects, true, 'SELECT_PROJECT: auto-expands archived section for archived project');

const selectAlreadyExpandedResult = selectProject({ ...BASE_STATE, showArchivedProjects: true }, { type: 'SELECT_PROJECT', payload: { projectId: archivedProject.id } });
assertEqual(selectAlreadyExpandedResult.state.showArchivedProjects, true, 'SELECT_PROJECT: keeps archived expanded if already expanded');

// --- SELECT_OVERVIEW ---
console.log('\n=== SELECT_OVERVIEW ===');

const selectOverview = _getHandlerForTesting('SELECT_OVERVIEW');
const overviewResult = selectOverview({ ...BASE_STATE, currentPage: 'project', currentProjectId: 'proj_1' });
assertEqual(overviewResult.state.currentPage, 'overview', 'SELECT_OVERVIEW: sets currentPage to overview');
assertEqual(overviewResult.state.currentProjectId, null, 'SELECT_OVERVIEW: clears currentProjectId');

// --- RENAME_PROJECT ---
console.log('\n=== RENAME_PROJECT ===');
Project._resetCacheForTesting();

const renameProject = _getHandlerForTesting('RENAME_PROJECT');
const renameable = Project.createProject({ name: 'Original Name' });

const renameResult = renameProject(BASE_STATE, { type: 'RENAME_PROJECT', payload: { projectId: renameable.id, newName: 'New Name' } });
assertEqual(renameResult.state.lastError, null, 'RENAME_PROJECT: no error on success');
assertEqual(Project.getProject(renameable.id).name, 'New Name', 'RENAME_PROJECT: project name updated in cache');

const renameErrorResult = renameProject(BASE_STATE, { type: 'RENAME_PROJECT', payload: { projectId: 'nonexistent', newName: 'x' } });
assert(renameErrorResult.state.lastError !== null, 'RENAME_PROJECT: sets lastError for unknown project');

// --- DELETE_PROJECT ---
console.log('\n=== DELETE_PROJECT ===');
Project._resetCacheForTesting();

const deleteProject = _getHandlerForTesting('DELETE_PROJECT');
const deleteable = Project.createProject({ name: 'Delete Me' });

const deleteResult = deleteProject(BASE_STATE, { type: 'DELETE_PROJECT', payload: { projectId: deleteable.id } });
assertEqual(deleteResult.state.lastError, null, 'DELETE_PROJECT: no error on success');
assertEqual(Project.getProject(deleteable.id), undefined, 'DELETE_PROJECT: project removed from cache');

// --- ARCHIVE_PROJECT / UNARCHIVE_PROJECT ---
console.log('\n=== ARCHIVE_PROJECT / UNARCHIVE_PROJECT ===');
Project._resetCacheForTesting();

const archiveProject = _getHandlerForTesting('ARCHIVE_PROJECT');
const unarchiveProject = _getHandlerForTesting('UNARCHIVE_PROJECT');
const archiveable = Project.createProject({ name: 'Archiveable' });

const archiveResult = archiveProject(BASE_STATE, { type: 'ARCHIVE_PROJECT', payload: { projectId: archiveable.id } });
assertEqual(archiveResult.state.showArchivedProjects, true, 'ARCHIVE_PROJECT: expands archived section');
assert(Project.getProject(archiveable.id).archived === true, 'ARCHIVE_PROJECT: project marked archived in cache');

const unarchiveResult = unarchiveProject(BASE_STATE, { type: 'UNARCHIVE_PROJECT', payload: { projectId: archiveable.id } });
assertEqual(unarchiveResult.state.lastError, null, 'UNARCHIVE_PROJECT: no error on success');
assert(Project.getProject(archiveable.id).archived === false, 'UNARCHIVE_PROJECT: project marked active in cache');

// --- TOGGLE_FUNDED ---
console.log('\n=== TOGGLE_FUNDED ===');
Project._resetCacheForTesting();

const toggleFunded = _getHandlerForTesting('TOGGLE_FUNDED');
const fundable = Project.createProject({ name: 'Fundable' });
assert(fundable.funded === false, 'TOGGLE_FUNDED: starts unfunded');

toggleFunded(BASE_STATE, { type: 'TOGGLE_FUNDED', payload: { projectId: fundable.id } });
assert(Project.getProject(fundable.id).funded === true, 'TOGGLE_FUNDED: marks project funded');

toggleFunded(BASE_STATE, { type: 'TOGGLE_FUNDED', payload: { projectId: fundable.id } });
assert(Project.getProject(fundable.id).funded === false, 'TOGGLE_FUNDED: toggles back to unfunded');

// --- TOGGLE_ARCHIVED_PROJECTS ---
console.log('\n=== TOGGLE_ARCHIVED_PROJECTS ===');

const toggleArchived = _getHandlerForTesting('TOGGLE_ARCHIVED_PROJECTS');
assertEqual(toggleArchived({ ...BASE_STATE, showArchivedProjects: false }).state.showArchivedProjects, true, 'TOGGLE_ARCHIVED_PROJECTS: false → true');
assertEqual(toggleArchived({ ...BASE_STATE, showArchivedProjects: true }).state.showArchivedProjects, false, 'TOGGLE_ARCHIVED_PROJECTS: true → false');

// --- START/CANCEL_CREATE_PROJECT ---
console.log('\n=== START/CANCEL_CREATE_PROJECT ===');

const startCreate = _getHandlerForTesting('START_CREATE_PROJECT');
const cancelCreate = _getHandlerForTesting('CANCEL_CREATE_PROJECT');
assertEqual(startCreate(BASE_STATE).state.isCreatingProject, true, 'START_CREATE_PROJECT: sets isCreatingProject to true');
assertEqual(cancelCreate({ ...BASE_STATE, isCreatingProject: true }).state.isCreatingProject, false, 'CANCEL_CREATE_PROJECT: sets isCreatingProject to false');

// --- Summary ---
console.log(`\n=== Summary ===`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
if (testsFailed > 0) process.exit(1);
