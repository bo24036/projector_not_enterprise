// Encapsulates all IndexedDB operations for the application.
// Handles graceful degradation in Node.js test environment where IDB is unavailable.

let openDB;
let db = null;

// Dynamically import idb from import map (browser) or fail gracefully (Node.js tests)
import('idb')
  .then(module => {
    openDB = module.openDB;
  })
  .catch(() => {
    // Node.js test environment: import map doesn't exist, idb unavailable
    openDB = undefined;
  });

// Initialize and return the database connection.
// Returns null if IDB is not available (Node.js test environment).
async function getDatabase() {
  // If idb is not available (Node.js test environment), return null
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

// Fetch a single project from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getProject(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('projects', id);
}

// Fetch all projects from IDB. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getAllProjects() {
  const database = await getDatabase();
  if (!database) return [];
  const projects = await database.getAll('projects');
  return projects || [];
}

// Save a project to IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function putProject(project) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('projects', project);
  } catch (error) {
    console.error(`Failed to persist project ${project.id}:`, error.message);
  }
}

// Delete a project from IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function deleteProject(id) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.delete('projects', id);
  } catch (error) {
    console.error(`Failed to delete project ${id}:`, error.message);
  }
}

// Fetch the maximum project ID currently stored in IDB.
// Returns 0 if no projects exist or IDB is unavailable.
export async function getMaxProjectId() {
  const database = await getDatabase();
  if (!database) return 0;

  try {
    const keys = await database.getAllKeys('projects');
    if (keys.length === 0) return 0;
    // Ensure keys are treated as numbers to avoid off-by-one errors
    const numericKeys = keys.map(k => Number(k));
    return Math.max(...numericKeys);
  } catch (error) {
    console.error('Failed to read project IDs from IDB:', error.message);
    return 0;
  }
}
