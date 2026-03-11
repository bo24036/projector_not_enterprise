// Factory for creating common handler patterns
import { registerHandler } from '../state.js';

/**
 * Creates START and CANCEL handlers for a creation toggle state.
 * Automatically registers both handlers with naming convention:
 * - START_CREATE_{entityType}
 * - CANCEL_CREATE_{entityType}
 *
 * @param {string} entityType - Entity type (Task, Person, Project) for action name
 * @param {string} stateKey - State key to toggle (creatingTask, creatingPerson, isCreatingProject)
 *
 * @example
 * createToggleCreateHandler('TASK', 'creatingTask');
 * // Registers: START_CREATE_TASK and CANCEL_CREATE_TASK
 */
export function createToggleCreateHandler(entityType, stateKey) {
  registerHandler(`START_CREATE_${entityType}`, (state) => {
    return { state: { ...state, [stateKey]: true } };
  });

  registerHandler(`CANCEL_CREATE_${entityType}`, (state) => {
    return { state: { ...state, [stateKey]: false } };
  });
}

/**
 * Creates START_EDIT and CANCEL_EDIT handlers for an entity type.
 * Automatically registers both handlers with naming convention:
 * - START_EDIT_{entityType}
 * - CANCEL_EDIT_{entityType}
 *
 * @param {string} entityType - Entity type (TASK, PERSON) for action names
 * @param {object} config - Configuration object
 * @param {function} config.getter - Domain getter function (e.g., Task.getTask)
 * @param {string} config.idPayloadKey - Action payload key for the entity ID (e.g., 'taskId')
 * @param {string} config.stateIdKey - State key for the entity ID (e.g., 'editingTaskId')
 * @param {array} config.stateKeys - All state keys to clear on cancel (e.g., ['editingTaskId', 'editingTaskName', 'editingTaskDueDate'])
 * @param {function} config.buildFieldState - Function that takes entity and returns object of state field updates
 *
 * @example
 * createEditHandlers('TASK', {
 *   getter: Task.getTask,
 *   idPayloadKey: 'taskId',
 *   stateIdKey: 'editingTaskId',
 *   stateKeys: ['editingTaskId', 'editingTaskName', 'editingTaskDueDate'],
 *   buildFieldState: (task) => ({
 *     editingTaskName: task.name,
 *     editingTaskDueDate: task.dueDate ? Task.formatDueDate(task.dueDate) : '',
 *   }),
 * });
 * // Registers: START_EDIT_TASK and CANCEL_EDIT_TASK
 */
export function createEditHandlers(entityType, config) {
  const { getter, idPayloadKey, stateIdKey, stateKeys, buildFieldState } = config;

  registerHandler(`START_EDIT_${entityType}`, (state, action) => {
    const id = action.payload[idPayloadKey];
    const entity = getter(id);

    if (!entity) {
      console.error(`${entityType.toLowerCase()} not found: ${id}`);
      return { state };
    }

    const fieldState = buildFieldState(entity);

    return {
      state: {
        ...state,
        [stateIdKey]: id,
        ...fieldState,
      },
    };
  });

  const resetState = {};
  stateKeys.forEach((key) => {
    resetState[key] = null;
  });

  registerHandler(`CANCEL_EDIT_${entityType}`, (state) => {
    return { state: { ...state, ...resetState } };
  });
}
