import './handlers/ProjectHandler.js';
import { initSidebarConnector } from './ui/connectors/SidebarConnector.js';
import { initProjectDetailConnector } from './ui/connectors/ProjectDetailConnector.js';
import { initRouter } from './utils/router.js';
import { getState, setRootRenderer } from './state.js';
import { idbReady } from './services/IdbService.js';

function renderApp() {
  const state = getState();
  initSidebarConnector('#sidebar', state);
  initProjectDetailConnector('#main-content', state);
}

async function initApp() {
  // Wait for IDB module to be ready before rendering
  // This ensures getAllProjectsFromIdb() has openDB available on hard reload
  await idbReady;

  // Register root renderer before router init so initial navigation triggers render
  setRootRenderer(renderApp);

  // Initialize router - this will dispatch initial navigation action
  initRouter();

  // Render initial state
  renderApp();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
