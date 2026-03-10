import * as Task from './Task.js';

// Test utilities
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
  assert(actual === expected, `${message} (expected ${expected}, got ${actual})`);
}

function assertDeepEqual(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// Factory Tests
console.log('\n=== Factory Tests ===');

const projectId = 'project_123';

// Test: createTask generates unique IDs
const task1 = Task.createTask(projectId, 'Task 1');
const task2 = Task.createTask(projectId, 'Task 2');
assert(task1.id !== task2.id, 'createTask generates unique IDs');

// Test: createTask with empty name throws
try {
  Task.createTask(projectId, '   ');
  assert(false, 'createTask throws on empty name');
} catch (e) {
  assert(e.message === 'Task name cannot be empty', 'createTask throws on empty name');
}

// Test: createTask initializes required fields
assert(task1.projectId === projectId, 'Task has correct projectId');
assert(task1.name === 'Task 1', 'Task has correct name');
assert(task1.completed === false, 'Task.completed defaults to false');
assert(task1.dueDate === null, 'Task.dueDate defaults to null');
assert(task1.parentTaskId === null, 'Task.parentTaskId defaults to null');
assert(task1.createdAt !== undefined, 'Task has createdAt');
assert(task1.updatedAt !== undefined, 'Task has updatedAt');

// Test: createTask with dueDate string
const taskWithDue = Task.createTask(projectId, 'Task with due', 'tomorrow');
assert(taskWithDue.dueDate !== null, 'createTask parses dueDate string');
assert(typeof taskWithDue.dueDate === 'number', 'dueDate is a timestamp (number)');

// Date Parsing Tests
console.log('\n=== Date Parsing Tests ===');

// Helper to get today at midnight
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function getDaysFromToday(days) {
  const today = new Date();
  today.setDate(today.getDate() + days);
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
}

// Test: +5 days parsing
const futureTask = Task.createTask(projectId, 'Future', '+5');
assertEqual(futureTask.dueDate, getDaysFromToday(5), 'Parses "+5" as 5 days from today');

// Test: tomorrow parsing
const tomorrowTask = Task.createTask(projectId, 'Tomorrow', 'tomorrow');
assertEqual(tomorrowTask.dueDate, getDaysFromToday(1), 'Parses "tomorrow" correctly');

// Test: today parsing
const todayTask = Task.createTask(projectId, 'Today', 'today');
assertEqual(todayTask.dueDate, getToday(), 'Parses "today" correctly');

// Test: YYYY-MM-DD parsing
const specificTask = Task.createTask(projectId, 'Specific', '2025-02-25');
const expectedDate = new Date(2025, 1, 25).getTime();
assertEqual(specificTask.dueDate, expectedDate, 'Parses YYYY-MM-DD correctly');

// Test: MM/DD parsing
const mmDdTask = Task.createTask(projectId, 'MM/DD', '03/15');
const now = new Date();
const expectedMmDd = new Date(now.getFullYear(), 2, 15).getTime();
assertEqual(mmDdTask.dueDate, expectedMmDd, 'Parses MM/DD correctly');

// Test: MM/DD/YYYY parsing
const mmDdYyyyTask = Task.createTask(projectId, 'MM/DD/YYYY', '03/15/2026');
const expectedMmDdYyyy = new Date(2026, 2, 15).getTime();
assertEqual(mmDdYyyyTask.dueDate, expectedMmDdYyyy, 'Parses MM/DD/YYYY correctly');

// Test: invalid format returns null
const invalidTask = Task.createTask(projectId, 'Invalid', 'invalid-date-format');
assert(invalidTask.dueDate === null, 'Invalid date format returns null');

// Test: null/empty dueDate input returns null
const nullTask = Task.createTask(projectId, 'Null', null);
assert(nullTask.dueDate === null, 'null dueDate input returns null');

const emptyTask = Task.createTask(projectId, 'Empty', '');
assert(emptyTask.dueDate === null, 'Empty dueDate input returns null');

// Test: case-insensitive parsing
const lowerTask = Task.createTask(projectId, 'Lower', 'TOMORROW');
assertEqual(lowerTask.dueDate, getDaysFromToday(1), 'Date parsing is case-insensitive');

// Query Tests - Date Formatting
console.log('\n=== Date Formatting Tests ===');

const overdue = Task.formatDueDate(getToday() - 1000 * 60 * 60 * 24);
assertEqual(overdue, 'overdue', 'Formats past date as "overdue"');

const due_today = Task.formatDueDate(getToday());
assertEqual(due_today, 'due today', 'Formats today as "due today"');

const due_tomorrow = Task.formatDueDate(getDaysFromToday(1));
assertEqual(due_tomorrow, 'due tomorrow', 'Formats tomorrow as "due tomorrow"');

const due_in_3 = Task.formatDueDate(getDaysFromToday(3));
assertEqual(due_in_3, 'due in 3 days', 'Formats 3 days out as "due in 3 days"');

const due_in_7 = Task.formatDueDate(getDaysFromToday(7));
assertEqual(due_in_7, 'due in 7 days', 'Formats 7 days out as "due in 7 days"');

const due_in_8 = Task.formatDueDate(getDaysFromToday(8));
assert(due_in_8.includes('/'), 'Formats 8+ days out with date format (includes /)');

const no_date = Task.formatDueDate(null);
assert(no_date === null, 'Formats null dueDate as null');

// Query Tests - Urgency
console.log('\n=== Urgency Tests ===');

const urgency_overdue = Task.getUrgency(getToday() - 1000 * 60 * 60 * 24);
assertEqual(urgency_overdue, 'red', 'Overdue tasks are red');

const urgency_today = Task.getUrgency(getToday());
assertEqual(urgency_today, 'red', 'Tasks due today are red');

const urgency_tomorrow = Task.getUrgency(getDaysFromToday(1));
assertEqual(urgency_tomorrow, 'red', 'Tasks due tomorrow are red');

const urgency_2days = Task.getUrgency(getDaysFromToday(2));
assertEqual(urgency_2days, 'orange', 'Tasks due in 2 days are orange');

const urgency_3days = Task.getUrgency(getDaysFromToday(3));
assertEqual(urgency_3days, 'yellow', 'Tasks due in 3 days are yellow');

const urgency_4days = Task.getUrgency(getDaysFromToday(4));
assertEqual(urgency_4days, 'gray', 'Tasks due in 4 days are gray');

const urgency_null = Task.getUrgency(null);
assertEqual(urgency_null, 'gray', 'Tasks with no due date are gray');

// Query Tests - getTask
console.log('\n=== Query: getTask ===');

const retrieved = Task.getTask(task1.id);
assertEqual(retrieved?.name, 'Task 1', 'getTask returns task by ID');
assertEqual(retrieved?.id, task1.id, 'getTask returns correct ID');

const notFound = Task.getTask('nonexistent_id');
assert(notFound === undefined, 'getTask returns undefined for missing ID');

// Query Tests - getTasksByProjectId
console.log('\n=== Query: getTasksByProjectId ===');

// Create tasks with different due dates
Task._resetCacheForTesting();
const proj = 'proj_test';
const t1 = Task.createTask(proj, 'Task 1', '2025-03-15'); // 3/15
const t2 = Task.createTask(proj, 'Task 2');                 // null (no date)
const t3 = Task.createTask(proj, 'Task 3', '2025-03-10'); // 3/10
const t4 = Task.createTask(proj, 'Task 4', '2025-03-20'); // 3/20

const tasks = Task.getTasksByProjectId(proj);
assertEqual(tasks.length, 4, 'getTasksByProjectId returns all tasks for project');

// Verify sorting: soonest due first, then no-date tasks
assertEqual(tasks[0].id, t3.id, 'First task is soonest (3/10)');
assertEqual(tasks[1].id, t1.id, 'Second task is next soonest (3/15)');
assertEqual(tasks[2].id, t4.id, 'Third task is furthest (3/20)');
assertEqual(tasks[3].id, t2.id, 'Last task has no due date');

// Query: getTasksByProjectId for different project should be empty
const otherProj = Task.getTasksByProjectId('other_project');
assertEqual(otherProj.length, 0, 'getTasksByProjectId returns empty for project with no tasks');

// Change Function Tests - updateTask
console.log('\n=== Change Function: updateTask ===');

const toUpdate = Task.createTask(proj, 'Original', '2025-03-20');
const originalId = toUpdate.id;

const updated = Task.updateTask(originalId, { name: 'Updated' });
assertEqual(updated.name, 'Updated', 'updateTask changes name');
assertEqual(updated.id, originalId, 'updateTask preserves ID');
assert(updated.updatedAt >= toUpdate.updatedAt, 'updateTask updates timestamp');

const withDueDate = Task.updateTask(originalId, { dueDate: 'tomorrow' });
assert(withDueDate.dueDate !== null, 'updateTask changes dueDate');

const cleared = Task.updateTask(originalId, { dueDate: null });
assert(cleared.dueDate === null, 'updateTask clears dueDate');

// Test: updateTask with empty name throws
try {
  Task.updateTask(originalId, { name: '   ' });
  assert(false, 'updateTask throws on empty name');
} catch (e) {
  assert(e.message === 'Task name cannot be empty', 'updateTask throws on empty name');
}

// Test: updateTask on nonexistent task throws
try {
  Task.updateTask('nonexistent_id', { name: 'Test' });
  assert(false, 'updateTask throws on nonexistent ID');
} catch (e) {
  assert(e.message === 'Task not found', 'updateTask throws on nonexistent ID');
}

// Change Function Tests - toggleTaskCompleted
console.log('\n=== Change Function: toggleTaskCompleted ===');

const toToggle = Task.createTask(proj, 'Toggle Test');
assert(toToggle.completed === false, 'Task starts incomplete');

const toggled1 = Task.toggleTaskCompleted(toToggle.id);
assert(toggled1.completed === true, 'toggleTaskCompleted marks task complete');

const toggled2 = Task.toggleTaskCompleted(toToggle.id);
assert(toggled2.completed === false, 'toggleTaskCompleted marks task incomplete');

// Test: toggleTaskCompleted on nonexistent task throws
try {
  Task.toggleTaskCompleted('nonexistent_id');
  assert(false, 'toggleTaskCompleted throws on nonexistent ID');
} catch (e) {
  assert(e.message === 'Task not found', 'toggleTaskCompleted throws on nonexistent ID');
}

// Change Function Tests - deleteTask
console.log('\n=== Change Function: deleteTask ===');

const toDelete = Task.createTask(proj, 'Delete Test');
const deleteId = toDelete.id;

const deleted = Task.deleteTask(deleteId);
assert(deleted === true, 'deleteTask returns true');

const afterDelete = Task.getTask(deleteId);
assert(afterDelete === undefined, 'Task is removed from cache after delete');

const projectTasks = Task.getTasksByProjectId(proj);
assert(!projectTasks.find(t => t.id === deleteId), 'Task is removed from projectIdIndex after delete');

// Test: deleteTask on nonexistent task throws
try {
  Task.deleteTask('nonexistent_id');
  assert(false, 'deleteTask throws on nonexistent ID');
} catch (e) {
  assert(e.message === 'Task not found', 'deleteTask throws on nonexistent ID');
}

// Edge Cases
console.log('\n=== Edge Cases ===');

// Test: Task with whitespace name is trimmed
const spacedTask = Task.createTask(proj, '   Spaced Name   ');
assertEqual(spacedTask.name, 'Spaced Name', 'Task name is trimmed');

// Test: Multiple projects with same task names don't conflict
const proj1 = 'proj1';
const proj2 = 'proj2';
Task._resetCacheForTesting();
const p1t1 = Task.createTask(proj1, 'Same Name');
const p2t1 = Task.createTask(proj2, 'Same Name');
assert(p1t1.id !== p2t1.id, 'Same task name in different projects creates unique IDs');

const proj1Tasks = Task.getTasksByProjectId(proj1);
const proj2Tasks = Task.getTasksByProjectId(proj2);
assertEqual(proj1Tasks.length, 1, 'Project 1 has 1 task');
assertEqual(proj2Tasks.length, 1, 'Project 2 has 1 task');

// Test: Past date parsing
const pastTask = Task.createTask(proj, 'Past', '2020-01-01');
assert(pastTask.dueDate < getToday(), 'Past dates are parsed as negative delta');

// Test: Numeric timestamp as dueDate input
const numTask = Task.createTask(proj, 'Numeric', String(getDaysFromToday(5)));
assert(numTask.dueDate === getDaysFromToday(5), 'Numeric timestamp strings are parsed correctly');

// Summary
console.log('\n=== Test Summary ===');
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
}
