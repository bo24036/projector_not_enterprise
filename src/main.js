import './handlers/ProjectHandler.js';
import './handlers/TaskHandler.js';
import './handlers/PersonHandler.js';
import './handlers/NoteHandler.js';
import './handlers/DataTransferHandler.js';
import './handlers/ReportHandler.js';
import './handlers/ReadingListHandler.js';
import { initVersionCheck } from './utils/versionCheck.js';
import { UpdateBanner } from './ui/components/UpdateBanner.js';
import { initSidebarConnector } from './ui/connectors/SidebarConnector.js';
import { initProjectDetailConnector } from './ui/connectors/ProjectDetailConnector.js';
import { initOverviewConnector } from './ui/connectors/OverviewConnector.js';
import { initPersonalTasksConnector } from './ui/connectors/PersonalTasksConnector.js';
import { initYearEndReportConnector } from './ui/connectors/YearEndReportConnector.js';
import { initReadingListConnector } from './ui/connectors/ReadingListConnector.js';
import { ErrorNotification } from './ui/components/ErrorNotification.js';
import { render, nothing } from '/vendor/lit-html/lit-html.js';
import { initRouter } from './utils/router.js';
import { initKeyboardShortcuts } from './utils/keyboardShortcuts.js';
import { getState, setRootRenderer } from './state.js';
import { initDebug } from './utils/debug.js';
import { idbReady } from './utils/IdbService.js';
import { initAutoBackup } from './utils/AutoBackup.js';
import * as Project from './domains/Project.js';
import * as Person from './domains/Person.js';
import * as Settings from './domains/Settings.js';
import * as ReadingList from './domains/ReadingList.js';

function renderApp() {
  const state = getState();
  initSidebarConnector('#sidebar', state);

  if (state.currentPage === 'overview') {
    initOverviewConnector('#main-content', state);
  } else if (state.currentPage === 'personal') {
    initPersonalTasksConnector('#main-content', state);
  } else if (state.currentPage === 'readingList') {
    initReadingListConnector('#main-content', state);
  } else if (state.currentPage === 'yearEndReport') {
    initYearEndReportConnector('#main-content', state);
  } else {
    initProjectDetailConnector('#main-content', state);
  }

  // Render error notification if one exists (auto-dismiss handled by SET_ERROR effect)
  const errorContainer = document.querySelector('#error-notification');
  if (errorContainer) {
    render(ErrorNotification({ error: state.lastError }), errorContainer);
  }

  const updateContainer = document.querySelector('#update-banner');
  if (updateContainer) {
    render(
      state.updateAvailable ? UpdateBanner({ onReload: () => location.reload() }) : nothing,
      updateContainer
    );
  }
}

async function initApp() {
  // Wait for IDB module to be ready before rendering
  // This ensures getAllProjectsFromIdb() has openDB available on hard reload
  await idbReady;

  // Load saved backup directory handle from IDB (no permission request — lazy on first write)
  await initAutoBackup();

  // Pre-load all projects into cache before router initialization
  // This ensures projects are available synchronously for all handlers and connectors
  await Project.getAllProjectsAsync();

  // Pre-load all people into cache for autocomplete
  // This ensures people names/roles are available synchronously for autocomplete
  await Person.preloadAllPeople();

  // Pre-load suppressed names from IDB
  // This ensures suppressed names are loaded before autocomplete is rendered
  await Person.preloadSuppressedNames();

  // Pre-load app settings from IDB
  await Settings.preloadSettings();

  // Pre-load all reading list items into cache
  await ReadingList.preloadAll();

  // Register root renderer before router init so initial navigation triggers render
  setRootRenderer(renderApp);

  // Expose debug tools on window.__projector
  initDebug();

  // Register global keyboard shortcuts
  initKeyboardShortcuts();

  // Initialize router - this will dispatch initial navigation action
  // The dispatch will schedule renderApp via rAF, so we don't need to call it explicitly
  initRouter();

  // Start polling for new versions (no-op if version.json not present)
  initVersionCheck();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
