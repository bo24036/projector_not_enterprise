import * as Project from '../domains/Project.js';
import { registerHandler, dispatch } from '../state.js';

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

  // Update state immediately to switch to project page
  const nextState = { ...state, currentPage: 'project', currentProjectId: projectId };

  // Check if project is archived and auto-expand archived section if needed
  // Project is guaranteed to be in cache from startup load
  const project = Project.getProject(projectId);
  if (project?.archived && !state.showArchivedProjects) {
    // Project is archived and archived section is not shown; expand it
    dispatch({ type: 'TOGGLE_ARCHIVED_PROJECTS' });
  }

  return { state: nextState };
});

registerHandler('SELECT_OVERVIEW', (state) => {
  return { state: { ...state, currentPage: 'overview', currentProjectId: null } };
});

registerHandler('RENAME_PROJECT', (state, action) => {
  const { projectId, newName } = action.payload;

  try {
    Project.renameProject(projectId, newName);
  } catch (error) {
    console.error('Failed to rename project:', error.message);
  }
  return { state };
});

registerHandler('UPDATE_DESCRIPTION', (state, action) => {
  const { projectId, description } = action.payload;

  try {
    Project.updateDescription(projectId, description);
  } catch (error) {
    console.error('Failed to update description:', error.message);
  }
  return { state };
});

registerHandler('DELETE_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.deleteProject(projectId);
  } catch (error) {
    console.error('Failed to delete project:', error.message);
  }
  return { state };
});

registerHandler('ARCHIVE_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.archiveProject(projectId);
  } catch (error) {
    console.error('Failed to archive project:', error.message);
  }
  return { state };
});

registerHandler('UNARCHIVE_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.unarchiveProject(projectId);
  } catch (error) {
    console.error('Failed to unarchive project:', error.message);
  }
  return { state };
});

registerHandler('TOGGLE_ARCHIVED_PROJECTS', (state) => {
  return { state: { ...state, showArchivedProjects: !state.showArchivedProjects } };
});

registerHandler('TOGGLE_FUNDED', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.toggleFunded(projectId);
  } catch (error) {
    console.error('Failed to toggle funded:', error.message);
  }
  return { state };
});

registerHandler('START_CREATE_PROJECT', (state) => {
  return { state: { ...state, isCreatingProject: true } };
});

registerHandler('CANCEL_CREATE_PROJECT', (state) => {
  return { state: { ...state, isCreatingProject: false } };
});

registerHandler('PROJECT_LOADED', (state) => {
  // Project is already in cache from domain's cache-miss fetch.
  // This handler just triggers a re-render via setState.
  return { state };
});

registerHandler('PROJECTS_LOADED', (state) => {
  // All projects are already in cache from domain's fetch-all.
  // This handler just triggers a re-render via setState.
  return { state };
});
