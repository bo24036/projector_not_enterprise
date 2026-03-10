// Import dispatch from local module (always available)
import { dispatch } from '../state.js';

// Import IDB operations from service layer (isolates persistence I/O)
import { getProject as getProjectFromIdb, getAllProjects as getAllProjectsFromIdb, putProject as putProjectToIdb, deleteProject as deleteProjectFromIdb } from '../services/IdbService.js';

const projectCache = new Map();
const writeQueue = new Map(); // Tracks queued IDs to prevent concurrent writes
const fetchQueue = new Set(); // Tracks IDs currently being fetched (prevents duplicate fetches)
let projectsLoaded = false; // Tracks if we've already fetched all projects from IDB

const ERROR_PROJECT_NOT_FOUND = 'Project not found';

// Generate a GUID for unique project IDs (eliminates off-by-one issues)
function generateId() {
  return 'proj_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Queue a write to IDB. If already queued, replaces the previous write.
// This ensures deduplication: rapid mutations to the same ID result in one final write.
// Delegates to IdbService; gracefully skips IDB if unavailable (Node.js test environment).
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
    if (!queued) return;

    writeQueue.delete(id);

    try {
      if (queued.operation === 'delete') {
        await deleteProjectFromIdb(queued.project.id);
      } else {
        await putProjectToIdb(queued.project);
      }
    } catch (error) {
      console.error(`[Project.serialize] Error persisting project ${id}:`, error.message);
    }
  });
}

export function createProject(overrides = {}) {
  const name = overrides.name?.trim() || '';

  if (!name) {
    throw new Error('Project name cannot be empty');
  }

  // Check duplicates against in-memory cache (always available)
  // Do not call getAllProjects() which may return empty during cache miss
  const cachedProjects = Array.from(projectCache.values());
  if (cachedProjects.some(p => p.name === name)) {
    throw new Error('Project name already exists');
  }

  const project = {
    id: generateId(),
    name,
    description: overrides.description || '',
    archived: overrides.archived || false,
    funded: overrides.funded || false,
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
        const project = await getProjectFromIdb(id);
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
  // If already fetched, return sorted cache; if fetch in progress, return empty
  if (projectsLoaded) {
    return Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const cached = Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (cached.length > 0) {
    return cached;
  }

  // Cache miss: queue async fetch of all projects from IDB
  projectsLoaded = true;
  queueMicrotask(async () => {
    try {
      const allProjects = await getAllProjectsFromIdb();
      if (allProjects && allProjects.length > 0) {
        allProjects.forEach(project => projectCache.set(project.id, project));
        if (dispatch) {
          dispatch({ type: 'PROJECTS_LOADED', payload: { projects: allProjects } });
        }
      }
    } catch (error) {
      console.error('Failed to fetch all projects:', error.message);
    }
  });

  return cached;
}

export function renameProject(id, newName) {
  if (!newName?.trim()) {
    throw new Error('Project name cannot be empty');
  }

  const trimmedName = newName.trim();
  // Check duplicates against in-memory cache, not full list that may be async-loading
  const cachedProjects = Array.from(projectCache.values());

  if (cachedProjects.some(p => p.id !== id && p.name === trimmedName)) {
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

export function archiveProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.archived = true;
  serialize(project, 'put');
  return project;
}

export function unarchiveProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.archived = false;
  serialize(project, 'put');
  return project;
}

export function toggleFunded(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.funded = !project.funded;
  serialize(project, 'put');
  return project;
}

// ID initialization no longer needed - GUIDs are generated on demand

// Test utility - clears cache and resets state
export function _resetCacheForTesting() {
  projectCache.clear();
  projectsLoaded = false;
}
