import * as Task from '../domains/Task.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createEditHandlers, createNoOpLoadedHandler } from '../utils/handlerFactory.js';

registerHandler('CREATE_TASK', (state, action) => {
  const { projectId, name, dueDate } = action.payload;

  try {
    Task.createTask(projectId, name, dueDate);
    return { state: { ...state, creatingTask: false } };
  } catch (error) {
    alert(error.message);
    return { state };
  }
});

registerHandler('UPDATE_TASK', (state, action) => {
  const { taskId, name, dueDate, completed } = action.payload;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (completed !== undefined) updates.completed = completed;

  try {
    Task.updateTask(taskId, updates);
    return { state: { ...state, editingTaskId: null, editingTaskName: '', editingTaskDueDate: '' } };
  } catch (error) {
    console.error('Failed to update task:', error.message);
    return { state };
  }
});

registerHandler('DELETE_TASK', (state, action) => {
  const { taskId } = action.payload;

  try {
    Task.deleteTask(taskId);
  } catch (error) {
    console.error('Failed to delete task:', error.message);
  }
  return { state };
});

registerHandler('TOGGLE_TASK_COMPLETED', (state, action) => {
  const { taskId } = action.payload;

  try {
    Task.toggleTaskCompleted(taskId);
  } catch (error) {
    console.error('Failed to toggle task:', error.message);
  }
  return { state };
});

// Create START_CREATE_TASK and CANCEL_CREATE_TASK handlers
createToggleCreateHandler('TASK', 'creatingTask');

// Create START_EDIT_TASK and CANCEL_EDIT_TASK handlers
createEditHandlers('TASK', {
  getter: Task.getTask,
  idPayloadKey: 'taskId',
  stateIdKey: 'editingTaskId',
  stateKeys: ['editingTaskId', 'editingTaskName', 'editingTaskDueDate'],
  buildFieldState: (task) => ({
    editingTaskName: task.name,
    editingTaskDueDate: task.dueDate ? Task.formatDueDate(task.dueDate) : '',
  }),
});

// Create no-op handlers that trigger re-renders when data is loaded
createNoOpLoadedHandler('TASK_LOADED');
createNoOpLoadedHandler('PERSONAL_TASKS_LOADED');

registerHandler('SELECT_PERSONAL_TASKS', (state) => {
  return { state: { ...state, currentPage: 'personal', currentProjectId: null } };
});
