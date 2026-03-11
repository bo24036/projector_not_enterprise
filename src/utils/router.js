import { dispatch } from '../state.js';

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash;
  console.log('[router] handleRouteChange:', hash);

  // Parse #overview
  if (hash === '#overview') {
    console.log('[router] Dispatching SELECT_OVERVIEW');
    dispatch({ type: 'SELECT_OVERVIEW' });
    return;
  }

  // Parse #project/projectId/{id} as per UI-SPEC
  if (hash.startsWith('#project/projectId/')) {
    const projectId = hash.replace('#project/projectId/', '');
    if (projectId) {
      console.log('[router] Dispatching SELECT_PROJECT:', projectId);
      dispatch({ type: 'SELECT_PROJECT', payload: { projectId } });
      return;
    }
  }

  // Default to overview
  console.log('[router] Defaulting to SELECT_OVERVIEW');
  dispatch({ type: 'SELECT_OVERVIEW' });
}

export function navigateToProject(projectId) {
  window.location.hash = `#project/projectId/${projectId}`;
}

export function navigateToOverview() {
  window.location.hash = '#overview';
}
