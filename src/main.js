import './handlers/ProjectHandler.js';
import './handlers/TaskHandler.js';
import { initSidebarConnector } from './ui/connectors/SidebarConnector.js';
import { initProjectDetailConnector } from './ui/connectors/ProjectDetailConnector.js';
import { initOverviewConnector } from './ui/connectors/OverviewConnector.js';
import { initRouter } from './utils/router.js';
import { getState, setRootRenderer } from './state.js';
import { idbReady } from './services/IdbService.js';
import * as Project from './domains/Project.js';

function renderApp() {
  const state = getState();
  console.log('[renderApp] Rendering with state:', { currentPage: state.currentPage, currentProjectId: state.currentProjectId, showArchivedProjects: state.showArchivedProjects });
  initSidebarConnector('#sidebar', state);

  if (state.currentPage === 'overview') {
    initOverviewConnector('#main-content', state);
  } else {
    initProjectDetailConnector('#main-content', state);
  }
}

async function initApp() {
  // Wait for IDB module to be ready before rendering
  // This ensures getAllProjectsFromIdb() has openDB available on hard reload
  await idbReady;

  // Pre-load all projects into cache before router initialization
  // This ensures projects are available synchronously for all handlers and connectors
  await Project.getAllProjectsAsync();

  // Register root renderer before router init so initial navigation triggers render
  setRootRenderer(renderApp);

  // Initialize router - this will dispatch initial navigation action
  // The dispatch will schedule renderApp via rAF, so we don't need to call it explicitly
  initRouter();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
