/**
 * Project Domain
 *
 * CACHE LOADING STRATEGY: EAGER (all projects pre-loaded at startup)
 * Rationale: Projects must be available synchronously for sidebar rendering. The sidebar
 * needs the complete project list (grouped by archived/non-archived) immediately on page load.
 * Additionally, the router must know if a URL-specified project is archived so it can auto-expand
 * the archived section on initial navigation. This requires projects to be in cache before router init.
 *
 * See: main.js:34 (getAllProjectsAsync() called before router init)
 */

// Import IDB operations from service layer (isolates persistence I/O)
import { getAllProjects as getAllProjectsFromIdb, putProject as putProjectToIdb, deleteProject as deleteProjectFromIdb, migrateProjectFields } from '../services/IdbService.js';
import { createPersistenceQueue } from '../utils/PersistenceQueue.js';
import { generateId } from '../utils/idGenerator.js';

const projectCache = new Map();
let projectsLoaded = false; // Tracks if we've already fetched all projects from IDB

const ERROR_PROJECT_NOT_FOUND = 'Project not found';

// Create persistence queue for write-through IDB operations
const serialize = createPersistenceQueue(
  {
    put: putProjectToIdb,
    delete: deleteProjectFromIdb,
  },
  'project'
);

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
    id: generateId('proj'),
    name,
    description: overrides.description || '',
    notes: overrides.notes || '',
    link: overrides.link || '',
    archived: overrides.archived || false,
    funded: overrides.funded || false,
    createdAt: overrides.createdAt || new Date().toISOString(),
    archivedAt: overrides.archivedAt || null,
  };

  projectCache.set(project.id, project);
  serialize(project, 'put');
  return project;
}

export function getProject(id) {
  // All projects are pre-loaded in cache at startup via getAllProjectsAsync()
  // This is now a simple synchronous cache lookup
  return projectCache.get(id);
}

export function getAllProjects() {
  // Return all projects from the in-memory cache, sorted by creation date
  // Cache is pre-populated at app startup via getAllProjectsAsync()
  return Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Eager-load all projects from IDB into the in-memory cache
// Called at app startup before router initialization
// Returns promise that resolves once cache is populated
export async function getAllProjectsAsync() {
  if (projectsLoaded) {
    return Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  projectsLoaded = true;

  try {
    // Migrate existing projects to add missing notes and link fields
    await migrateProjectFields();

    const allProjects = await getAllProjectsFromIdb();
    if (allProjects && allProjects.length > 0) {
      allProjects.forEach(project => {
        // Ensure fields exist (in case migration didn't run for some reason)
        if (project.notes === undefined) project.notes = '';
        if (project.link === undefined) project.link = '';
        projectCache.set(project.id, project);
      });
    }
    return allProjects || [];
  } catch (error) {
    console.error('Failed to fetch all projects:', error.message);
    projectsLoaded = false;
    return [];
  }
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

export function updateNotes(id, notes) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.notes = notes || '';
  serialize(project, 'put');
  return project;
}

export function updateLink(id, link) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.link = link || '';
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
  project.archivedAt = new Date().toISOString();
  serialize(project, 'put');
  return project;
}

export function unarchiveProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(ERROR_PROJECT_NOT_FOUND);
  }

  project.archived = false;
  project.archivedAt = null;
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
