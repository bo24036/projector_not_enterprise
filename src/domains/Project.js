const projectCache = new Map();
let nextId = 1;

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
  return project;
}

export function getProject(id) {
  return projectCache.get(id);
}

export function getAllProjects() {
  return Array.from(projectCache.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
    throw new Error('Project not found');
  }

  project.name = trimmedName;
  return project;
}

export function updateDescription(id, description) {
  const project = getProject(id);
  if (!project) {
    throw new Error('Project not found');
  }

  project.description = description || '';
  return project;
}

export function deleteProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error('Project not found');
  }

  projectCache.delete(id);
  return true;
}

// Test utility - clears cache and resets ID counter
export function _resetCacheForTesting() {
  projectCache.clear();
  nextId = 1;
}
