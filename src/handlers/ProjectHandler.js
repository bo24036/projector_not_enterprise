import * as Project from '../domains/Project.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createNoOpLoadedHandler } from '../utils/handlerFactory.js';

// Factory for simple domain mutation handlers that return unchanged state
function createMutationHandler(actionName, domainFn) {
  return registerHandler(actionName, (state, action) => {
    try {
      domainFn(action.payload);
    } catch (error) {
      console.error(`Failed to ${actionName.toLowerCase().replace(/_/g, ' ')}:`, error.message);
    }
    return { state };
  });
}

registerHandler('CREATE_PROJECT', (state, action) => {
  const { name } = action.payload;

  try {
    const project = Project.createProject({ name });
    return { state: { ...state, currentProjectId: project.id, isCreatingProject: false } };
  } catch (error) {
    alert(error.message);
    return { state };
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

createMutationHandler('ARCHIVE_PROJECT', ({ projectId }) => {
  Project.archiveProject(projectId);
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

// Create START_CREATE_PROJECT and CANCEL_CREATE_PROJECT handlers
createToggleCreateHandler('PROJECT', 'isCreatingProject');

// Create no-op handlers that trigger re-renders when projects are loaded
createNoOpLoadedHandler('PROJECT_LOADED');
createNoOpLoadedHandler('PROJECTS_LOADED');
