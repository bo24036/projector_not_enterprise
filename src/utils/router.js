import { dispatch } from '../state.js';

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash;

  // Parse #overview
  if (hash === '#overview') {
    dispatch({ type: 'SELECT_OVERVIEW' });
    return;
  }

  // Parse #personal
  if (hash === '#personal') {
    dispatch({ type: 'SELECT_PERSONAL_TASKS' });
    return;
  }

  // Parse #project/projectId/{id} as per UI-SPEC
  if (hash.startsWith('#project/projectId/')) {
    const projectId = hash.replace('#project/projectId/', '');
    if (projectId) {
      dispatch({ type: 'SELECT_PROJECT', payload: { projectId } });
      return;
    }
  }

  // Default to overview
  dispatch({ type: 'SELECT_OVERVIEW' });
}

export function navigateToProject(projectId) {
  window.location.hash = `#project/projectId/${projectId}`;
}

export function navigateToPersonal() {
  window.location.hash = '#personal';
}

export function navigateToOverview() {
  window.location.hash = '#overview';
}
