import './handlers/ProjectHandler.js';
import './handlers/TaskHandler.js';
import './handlers/PersonHandler.js';
import { initSidebarConnector } from './ui/connectors/SidebarConnector.js';
import { initProjectDetailConnector } from './ui/connectors/ProjectDetailConnector.js';
import { initOverviewConnector } from './ui/connectors/OverviewConnector.js';
import { initPersonalTasksConnector } from './ui/connectors/PersonalTasksConnector.js';
import { ErrorNotification } from './ui/components/ErrorNotification.js';
import { render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { initRouter } from './utils/router.js';
import { getState, setRootRenderer } from './state.js';
import { idbReady } from './services/IdbService.js';
import * as Project from './domains/Project.js';
import * as Person from './domains/Person.js';

function renderApp() {
  const state = getState();
  initSidebarConnector('#sidebar', state);

  if (state.currentPage === 'overview') {
    initOverviewConnector('#main-content', state);
  } else if (state.currentPage === 'personal') {
    initPersonalTasksConnector('#main-content', state);
  } else {
    initProjectDetailConnector('#main-content', state);
  }

  // Render error notification if one exists (auto-dismiss handled by SET_ERROR effect)
  const errorContainer = document.querySelector('#error-notification');
  if (errorContainer) {
    render(ErrorNotification({ error: state.lastError }), errorContainer);
  }
}

async function initApp() {
  // Wait for IDB module to be ready before rendering
  // This ensures getAllProjectsFromIdb() has openDB available on hard reload
  await idbReady;

  // Pre-load all projects into cache before router initialization
  // This ensures projects are available synchronously for all handlers and connectors
  await Project.getAllProjectsAsync();

  // Pre-load all people into cache for autocomplete
  // This ensures people names/roles are available synchronously for autocomplete
  await Person.preloadAllPeople();

  // Pre-load suppressed names from IDB
  // This ensures suppressed names are loaded before autocomplete is rendered
  await Person.preloadSuppressedNames();

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
