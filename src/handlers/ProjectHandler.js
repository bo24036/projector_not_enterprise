import * as Project from '../domains/Project.js';
import * as Task from '../domains/Task.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createNoOpLoadedHandler, createMutationHandler } from '../utils/handlerFactory.js';
import { navigateToProject } from '../utils/router.js';

registerHandler('CREATE_PROJECT', (state, action) => {
  const { name } = action.payload;

  try {
    const project = Project.createProject({ name });
    return {
      state: { ...state, currentProjectId: project.id, isCreatingProject: false },
      effects: [() => navigateToProject(project.id)],
    };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'CREATE_PROJECT',
          message: error.message,
          timestamp: Date.now(),
        },
      },
    };
  }
});

registerHandler('SELECT_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  // Check if project is archived and auto-expand archived section if needed
  const project = Project.getProject(projectId);
  const showArchived = project?.archived && !state.showArchivedProjects
    ? true
    : state.showArchivedProjects;

  // Update state in single atomic operation
  const nextState = {
    ...state,
    currentPage: 'project',
    currentProjectId: projectId,
    showArchivedProjects: showArchived,
  };

  return { state: nextState };
});

registerHandler('SELECT_OVERVIEW', (state) => {
  return { state: { ...state, currentPage: 'overview', currentProjectId: null } };
});

createMutationHandler('RENAME_PROJECT', ({ projectId, newName }) => {
  Project.renameProject(projectId, newName);
});

createMutationHandler('UPDATE_DESCRIPTION', ({ projectId, description }) => {
  Project.updateDescription(projectId, description);
});


createMutationHandler('DELETE_PROJECT', ({ projectId }) => {
  Project.deleteProject(projectId);
});

registerHandler('ARCHIVE_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.archiveProject(projectId);
    // Keep project selected and expand archived section to show it
    return { state: { ...state, showArchivedProjects: true } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: {
          actionType: 'ARCHIVE_PROJECT',
          message: error.message,
          entityId: projectId,
          timestamp: Date.now(),
        },
      },
    };
  }
});

createMutationHandler('UNARCHIVE_PROJECT', ({ projectId }) => {
  Project.unarchiveProject(projectId);
});

registerHandler('TOGGLE_ARCHIVED_PROJECTS', (state) => {
  return { state: { ...state, showArchivedProjects: !state.showArchivedProjects } };
});

createMutationHandler('TOGGLE_FUNDED', ({ projectId }) => {
  Project.toggleFunded(projectId);
});

createMutationHandler('HOLD_PROJECT', ({ projectId }) => {
  Project.holdProject(projectId);
});

registerHandler('SHOW_RESTORE_MODAL', (state, action) => {
  return { state: { ...state, restoringProjectId: action.payload.projectId ?? null } };
});

registerHandler('RESTORE_PROJECT', (state, action) => {
  const { projectId, clearDueDates } = action.payload;
  Project.restoreProject(projectId);
  if (clearDueDates) {
    Task.clearDueDatesForProject(projectId);
  }
  return { state: { ...state, restoringProjectId: null } };
});

// Create START_CREATE_PROJECT and CANCEL_CREATE_PROJECT handlers
createToggleCreateHandler('PROJECT', 'isCreatingProject');


// Create no-op handlers that trigger re-renders when projects are loaded
createNoOpLoadedHandler('PROJECT_LOADED');
createNoOpLoadedHandler('PROJECTS_LOADED');
