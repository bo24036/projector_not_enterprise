import * as Project from '../domains/Project.js';
import { registerHandler } from '../state.js';

registerHandler('CREATE_PROJECT', (state, action) => {
  const { name } = action.payload;

  try {
    const project = Project.createProject({ name });
    return {
      state: { ...state, currentProjectId: project.id, isCreatingProject: false },
      effects: [],
    };
  } catch (error) {
    alert(error.message);
    return {
      state,
      effects: [],
    };
  }
});

registerHandler('SELECT_PROJECT', (state, action) => {
  const { projectId } = action.payload;
  return {
    state: { ...state, currentProjectId: projectId },
    effects: [],
  };
});

registerHandler('RENAME_PROJECT', (state, action) => {
  const { projectId, newName } = action.payload;

  try {
    Project.renameProject(projectId, newName);
    return {
      state,
      effects: [],
    };
  } catch (error) {
    console.error('Failed to rename project:', error.message);
    return {
      state,
      effects: [],
    };
  }
});

registerHandler('UPDATE_DESCRIPTION', (state, action) => {
  const { projectId, description } = action.payload;

  try {
    Project.updateDescription(projectId, description);
    return {
      state,
      effects: [],
    };
  } catch (error) {
    console.error('Failed to update description:', error.message);
    return {
      state,
      effects: [],
    };
  }
});

registerHandler('DELETE_PROJECT', (state, action) => {
  const { projectId } = action.payload;

  try {
    Project.deleteProject(projectId);
    const newCurrentId = state.currentProjectId === projectId ? null : state.currentProjectId;
    return {
      state: { ...state, currentProjectId: newCurrentId },
      effects: [],
    };
  } catch (error) {
    console.error('Failed to delete project:', error.message);
    return {
      state,
      effects: [],
    };
  }
});

registerHandler('START_CREATE_PROJECT', (state, action) => {
  return {
    state: { ...state, isCreatingProject: true },
    effects: [],
  };
});

registerHandler('CANCEL_CREATE_PROJECT', (state, action) => {
  return {
    state: { ...state, isCreatingProject: false },
    effects: [],
  };
});
