// Task display object factory for connectors
import { formatDueDate, getUrgency } from '../domains/Task.js';

/**
 * Creates a formatted task display object with pre-calculated properties.
 * Consolidates date formatting, urgency calculation, and callback wrapping.
 *
 * @param {object} task - The task POJO from domain
 * @param {object} callbacks - Optional callbacks object
 * @param {function} callbacks.onToggle - Called when task completion toggles
 * @param {function} callbacks.onEdit - Called to start editing
 * @param {function} callbacks.onDelete - Called to delete task
 * @param {function} callbacks.onSave - Called to save task edits
 * @param {function} callbacks.onCancel - Called to cancel editing
 *
 * @returns {object} Display object ready for TaskListItem component
 *
 * @example
 * const taskDisplay = makeTaskDisplayObject(task, {
 *   onToggle: () => dispatch({ type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: task.id } }),
 *   onEdit: () => dispatch({ type: 'START_EDIT_TASK', payload: { taskId: task.id } }),
 * });
 */
export function makeTaskDisplayObject(task, callbacks = {}) {
  return {
    task,
    dueDateFormatted: formatDueDate(task.dueDate),
    urgency: getUrgency(task.dueDate),
    ...callbacks,
  };
}
