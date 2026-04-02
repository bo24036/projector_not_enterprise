// Factory for creating common handler patterns
import { registerHandler } from '../state.js';

/**
 * Creates a handler for simple domain mutations with consistent error handling.
 *
 * @param {string} actionName - Action type to register (e.g., 'RENAME_PROJECT')
 * @param {function} domainFn - Function receiving action.payload; should call domain mutation
 *
 * @example
 * createMutationHandler('RENAME_PROJECT', ({ projectId, newName }) => {
 *   Project.renameProject(projectId, newName);
 * });
 */
export function createMutationHandler(actionName, domainFn) {
  registerHandler(actionName, (state, action) => {
    try {
      domainFn(action.payload);
      // Return a new state object (not same reference) so the render is triggered —
      // the domain cache changed and the UI needs to reflect it.
      return { state: { ...state } };
    } catch (error) {
      return {
        state: {
          ...state,
          lastError: {
            actionType: actionName,
            message: error.message,
            timestamp: Date.now(),
          },
        },
      };
    }
  });
}

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
 * Only manages the entity ID in state; field values are derived from the
 * domain cache in connectors at render time (state holds IDs only, not text).
 *
 * @param {string} entityType - Entity type (TASK, PERSON) for action names
 * @param {object} config - Configuration object
 * @param {function} config.getter - Domain getter function (e.g., Task.getTask)
 * @param {string} config.idPayloadKey - Action payload key for the entity ID (e.g., 'taskId')
 * @param {string} config.stateIdKey - State key for the entity ID (e.g., 'editingTaskId')
 *
 * @example
 * createEditHandlers('TASK', {
 *   getter: Task.getTask,
 *   idPayloadKey: 'taskId',
 *   stateIdKey: 'editingTaskId',
 * });
 * // Registers: START_EDIT_TASK and CANCEL_EDIT_TASK
 */
export function createEditHandlers(entityType, config) {
  const { getter, idPayloadKey, stateIdKey } = config;

  registerHandler(`START_EDIT_${entityType}`, (state, action) => {
    const id = action.payload[idPayloadKey];
    const entity = getter(id);

    if (!entity) {
      console.error(`${entityType.toLowerCase()} not found: ${id}`);
      return { state };
    }

    return { state: { ...state, [stateIdKey]: id } };
  });

  registerHandler(`CANCEL_EDIT_${entityType}`, (state) => {
    return { state: { ...state, [stateIdKey]: null } };
  });
}

/**
 * Creates a no-op fulfillment handler that passes state unchanged.
 * Used for data-load handlers where the domain cache is already updated.
 * Returns the same state reference so dispatch skips the re-render —
 * preventing async IDB fetches from wiping in-progress inline forms.
 * The next user-initiated action will naturally re-render with fresh cache data.
 *
 * @param {string} actionType - Action type name (e.g., 'TASK_LOADED', 'PROJECTS_LOADED')
 *
 * @example
 * createNoOpLoadedHandler('TASK_LOADED');
 * // Registers: a handler that receives (state) => { state } (same reference = no render)
 */
export function createNoOpLoadedHandler(actionType) {
  registerHandler(actionType, (state) => {
    return { state };
  });
}
