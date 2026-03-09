// Conditional import for idb and dispatch - only available in browser
let openDB;
let dispatch;
if (typeof window !== 'undefined') {
  // Browser environment - import from CDN
  import('https://cdn.jsdelivr.net/npm/idb@7/+esm').then(module => {
    openDB = module.openDB;
  });
  // Import dispatch for cache-miss fulfillment
  import('../state.js').then(module => {
    dispatch = module.dispatch;
  });
}

const projectCache = new Map();
const writeQueue = new Map(); // Tracks queued IDs to prevent concurrent writes
const fetchQueue = new Set(); // Tracks IDs currently being fetched (prevents duplicate fetches)
let projectsLoaded = false; // Tracks if we've already fetched all projects from IDB
let nextId = 1;
let db = null;

const ERROR_PROJECT_NOT_FOUND = 'Project not found';

async function getDB() {
  // Skip IDB in Node.js test environment
  if (!openDB) return null;

  if (db) return db;
  db = await openDB('projector', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
    },
  });
  return db;
}

// Fetch a project from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getItem(id) {
  const database = await getDB();
  if (!database) return undefined;
  return database.get('projects', id);
}

// Queue a write to IDB. If already queued, replaces the previous write.
// This ensures deduplication: rapid mutations to the same ID result in one final write.
// Skips IDB in Node.js test environment where it's unavailable.
function serialize(project, operation) {
  const id = project.id;

  // If this ID is already queued, just mark for requeue on completion
  // The next microtask will handle the final state
  if (writeQueue.has(id)) {
    writeQueue.set(id, { project, operation });
    return;
  }

  // Mark this ID as queued
  writeQueue.set(id, { project, operation });

  // Schedule the actual write as a microtask
  queueMicrotask(async () => {
    const queued = writeQueue.get(id);
    if (!queued) return; // Should not happen, but safe guard

    writeQueue.delete(id);

    try {
      const database = await getDB();
      if (!database) return; // IDB not available (Node.js test environment)

      if (queued.operation === 'delete') {
        await database.delete('projects', id);
      } else {
        await database.put('projects', queued.project);
      }
    } catch (error) {
      console.error(`Failed to persist project ${id}:`, error.message);
      // Cache is already correct; silent failure acceptable for routine mutations
    }
  });
}

export function createProject(overrides = {}) {
  const name = overrides.name || '';

  if (!name.trim()) {
    throw new Error('Project name cannot be empty');
  }

  const trimmedName = name.trim();
  const allProjects = getAllProjects();

  if (allProjects.some(p => p.name === trimmedName)) {
    throw new Error('Project name already exists');
  }

  const project = {
    id: nextId++,
    name: trimmedName,
    description: overrides.description || '',
    createdAt: overrides.createdAt || new Date().toISOString(),
  };

  projectCache.set(project.id, project);
  serialize(project, 'put');
  return project;
}

export function getProject(id) {
  const cached = projectCache.get(id);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss: queue async fetch from IDB (fire-and-forget)
  if (!fetchQueue.has(id)) {
    fetchQueue.add(id);
    queueMicrotask(async () => {
      try {
        const project = await getItem(id);
        if (project) {
          // Populate cache
          projectCache.set(id, project);
          // Dispatch fulfillment action to trigger re-render
          if (dispatch) {
            dispatch({ type: 'PROJECT_LOADED', payload: { project } });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error.message);
      } finally {
        fetchQueue.delete(id);
      }
    });
  }

  return undefined;
}

export function getAllProjects() {
  const cached = Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // If we already have projects in cache, return them
  if (cached.length > 0 || projectsLoaded) {
    return cached;
  }

  // Cache miss: queue async fetch of all projects from IDB
  projectsLoaded = true;
  queueMicrotask(async () => {
    try {
      const database = await getDB();
      if (!database) return;

      const allProjects = await database.getAll('projects');
      if (allProjects && allProjects.length > 0) {
        // Populate cache with all projects
        allProjects.forEach(project => projectCache.set(project.id, project));
        // Dispatch fulfillment action to trigger re-render
        if (dispatch) {
          dispatch({ type: 'PROJECTS_LOADED', payload: { projects: allProjects } });
        }
      }
    } catch (error) {
      console.error('Failed to fetch all projects:', error.message);
    } finally {
      // Reset flag to allow retry if needed
      projectsLoaded = false;
    }
  });

  return cached; // Return empty array initially
}

export function renameProject(id, newName) {
  if (!newName?.trim()) {
    throw new Error('Project name cannot be empty');
  }

  const trimmedName = newName.trim();
  const allProjects = getAllProjects();

  if (allProjects.some(p => p.id !== id && p.name === trimmedName)) {
    throw new Error('Project name already exists');
  }

  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.name = trimmedName;
  serialize(project, 'put');
  return project;
}

export function updateDescription(id, description) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.description = description || '';
  serialize(project, 'put');
  return project;
}

export function deleteProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  projectCache.delete(id);
  serialize(project, 'delete');
  return true;
}

// Initialize: Determine nextId from IDB to ensure new projects don't overwrite existing ones
export async function initializeIdCounter() {
  if (!openDB) return; // Skip in Node.js test environment

  try {
    const database = await getDB();
    const keys = await database.getAllKeys('projects');
    if (keys.length > 0) {
      const maxId = Math.max(...keys);
      nextId = maxId + 1;
    }
  } catch (error) {
    console.error('Failed to initialize ID counter:', error.message);
    // Continue with default nextId = 1 if initialization fails
  }
}

// Test utility - clears cache and resets ID counter
export function _resetCacheForTesting() {
  projectCache.clear();
  projectsLoaded = false;
  nextId = 1;
}
