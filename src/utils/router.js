import { dispatch } from '../state.js';

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash;

  if (hash.startsWith('#project/')) {
    const projectId = hash.replace('#project/', '');
    if (projectId) {
      dispatch({ type: 'SELECT_PROJECT', payload: { projectId } });
      return;
    }
  }

  dispatch({ type: 'SELECT_PROJECT', payload: { projectId: null } });
}

export function navigateToProject(projectId) {
  window.location.hash = `#project/${projectId}`;
}

export function navigateToList() {
  window.location.hash = '';
}
