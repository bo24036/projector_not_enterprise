// Bump SW_VERSION whenever you:
// - Modify this file
// - Add or remove JS/CSS/vendor files
// - Make breaking data format changes
const SW_VERSION = '1';
const CACHE_NAME = `projector-v${SW_VERSION}`;

importScripts('/vendor/workbox/workbox-core.prod.js');
importScripts('/vendor/workbox/workbox-precaching.prod.js');
importScripts('/vendor/workbox/workbox-routing.prod.js');
importScripts('/vendor/workbox/workbox-strategies.prod.js');

const { precacheAndRoute } = workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { NetworkFirst } = workbox.strategies;

// App shell — all assets required to run the app offline.
// Maintain this list manually. Add/remove entries when files are added/removed,
// then bump SW_VERSION so the browser picks up the updated cache.
precacheAndRoute([
  // Entry point
  { url: '/index.html', revision: SW_VERSION },
  { url: '/manifest.json', revision: SW_VERSION },

  // Static assets
  { url: '/favicon.ico', revision: SW_VERSION },
  { url: '/icon-192.png', revision: SW_VERSION },
  { url: '/icon-512.png', revision: SW_VERSION },
  { url: '/icon.svg', revision: SW_VERSION },

  // Styles
  { url: '/styles/reset.css', revision: SW_VERSION },
  { url: '/styles/variables.css', revision: SW_VERSION },
  { url: '/styles/layout.css', revision: SW_VERSION },
  { url: '/styles/components.css', revision: SW_VERSION },

  // Vendor libraries
  { url: '/vendor/lit-html/lit-html.js', revision: SW_VERSION },
  { url: '/vendor/idb/idb.js', revision: SW_VERSION },

  // Core
  { url: '/src/main.js', revision: SW_VERSION },
  { url: '/src/state.js', revision: SW_VERSION },

  // Domains
  { url: '/src/domains/Project.js', revision: SW_VERSION },
  { url: '/src/domains/Task.js', revision: SW_VERSION },
  { url: '/src/domains/Person.js', revision: SW_VERSION },
  { url: '/src/domains/Note.js', revision: SW_VERSION },

  // Handlers
  { url: '/src/handlers/ProjectHandler.js', revision: SW_VERSION },
  { url: '/src/handlers/TaskHandler.js', revision: SW_VERSION },
  { url: '/src/handlers/PersonHandler.js', revision: SW_VERSION },
  { url: '/src/handlers/NoteHandler.js', revision: SW_VERSION },

  // Utils
  { url: '/src/utils/IdbService.js', revision: SW_VERSION },
  { url: '/src/utils/PersistenceQueue.js', revision: SW_VERSION },
  { url: '/src/utils/handlerFactory.js', revision: SW_VERSION },
  { url: '/src/utils/idGenerator.js', revision: SW_VERSION },
  { url: '/src/utils/router.js', revision: SW_VERSION },
  { url: '/src/utils/inputHandlers.js', revision: SW_VERSION },
  { url: '/src/utils/domUtils.js', revision: SW_VERSION },
  { url: '/src/utils/taskFormatting.js', revision: SW_VERSION },

  // UI Components
  { url: '/src/ui/components/ErrorNotification.js', revision: SW_VERSION },
  { url: '/src/ui/components/NoteInput.js', revision: SW_VERSION },
  { url: '/src/ui/components/NoteListItem.js', revision: SW_VERSION },
  { url: '/src/ui/components/OverviewPage.js', revision: SW_VERSION },
  { url: '/src/ui/components/PersonInput.js', revision: SW_VERSION },
  { url: '/src/ui/components/PersonListItem.js', revision: SW_VERSION },
  { url: '/src/ui/components/ProjectDetail.js', revision: SW_VERSION },
  { url: '/src/ui/components/ProjectInput.js', revision: SW_VERSION },
  { url: '/src/ui/components/ProjectListItem.js', revision: SW_VERSION },
  { url: '/src/ui/components/ProjectNewItem.js', revision: SW_VERSION },
  { url: '/src/ui/components/SuppressNamesModal.js', revision: SW_VERSION },
  { url: '/src/ui/components/TaskInput.js', revision: SW_VERSION },
  { url: '/src/ui/components/TaskListItem.js', revision: SW_VERSION },

  // UI Connectors
  { url: '/src/ui/connectors/SidebarConnector.js', revision: SW_VERSION },
  { url: '/src/ui/connectors/ProjectDetailConnector.js', revision: SW_VERSION },
  { url: '/src/ui/connectors/OverviewConnector.js', revision: SW_VERSION },
  { url: '/src/ui/connectors/PersonalTasksConnector.js', revision: SW_VERSION },
  { url: '/src/ui/connectors/NoteListConnector.js', revision: SW_VERSION },
  { url: '/src/ui/connectors/TaskListConnector.js', revision: SW_VERSION },
]);

// NetworkFirst for all requests:
// - Dev/online: network wins → always fresh code
// - Offline: falls back to precache
const networkFirst = new NetworkFirst({ cacheName: CACHE_NAME });

registerRoute(new NavigationRoute(networkFirst));
registerRoute(({ request }) => request.destination === 'script', networkFirst);
registerRoute(({ request }) => request.destination === 'style', networkFirst);

// Take control immediately on activation rather than waiting for next navigation.
// Delete stale cache buckets from previous SW versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('projector-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});
