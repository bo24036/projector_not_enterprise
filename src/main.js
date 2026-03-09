import './handlers/ProjectHandler.js';
import { initSidebarConnector } from './ui/connectors/SidebarConnector.js';
import { initProjectDetailConnector } from './ui/connectors/ProjectDetailConnector.js';
import { initRouter } from './utils/router.js';

const SW_VERSION = 1;

function initApp() {
  // Initialize router first so it can dispatch initial navigation
  initRouter();

  // Initialize connectors
  initSidebarConnector('#sidebar');
  initProjectDetailConnector('#main-content');

  // Register service worker if in production
  if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .catch(error => console.error('Service Worker registration failed:', error));
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
