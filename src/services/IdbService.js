// Encapsulates all IndexedDB operations for the application.
// Handles graceful degradation in Node.js test environment where IDB is unavailable.

let openDB;
let db = null;

// Promise that resolves when idb module is loaded
const idbReady = import('idb')
  .then(module => {
    openDB = module.openDB;
    return openDB;
  })
  .catch(() => {
    // Node.js test environment: import map doesn't exist, idb unavailable
    openDB = undefined;
    return undefined;
  });

// Initialize and return the database connection.
// Returns null if IDB is not available (Node.js test environment).
async function getDatabase() {
  // If idb is not available (Node.js test environment), return null
  if (!openDB) return null;

  if (db) return db;

  db = await openDB('projector', 5, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('people')) {
        db.createObjectStore('people', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
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

// Fetch a single task from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getTask(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('tasks', id);
}

// Fetch all tasks for a project from IDB. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getTasksByProjectId(projectId) {
  const database = await getDatabase();
  if (!database) return [];
  const tasks = await database.getAll('tasks');
  return (tasks || []).filter(task => task.projectId === projectId);
}

// Fetch all personal tasks (projectId: null) from IDB. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getPersonalTasksFromIdb() {
  const database = await getDatabase();
  if (!database) return [];
  const tasks = await database.getAll('tasks');
  return (tasks || []).filter(task => task.projectId === null);
}

// Save a task to IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function putTask(task) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('tasks', task);
  } catch (error) {
    console.error(`Failed to persist task ${task.id}:`, error.message);
  }
}

// Delete a task from IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function deleteTask(id) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.delete('tasks', id);
  } catch (error) {
    console.error(`Failed to delete task ${id}:`, error.message);
  }
}

// Fetch a single person from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getPersonFromIdb(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('people', id);
}

// Fetch all people for a project from IDB. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getPeopleByProjectIdFromIdb(projectId) {
  const database = await getDatabase();
  if (!database) return [];
  const people = await database.getAll('people');
  return (people || []).filter(person => person.projectId === projectId);
}

// Fetch all people from IDB for autocomplete. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getAllPeopleFromIdb() {
  const database = await getDatabase();
  if (!database) return [];
  const people = await database.getAll('people');
  return people || [];
}

// Save a person to IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function putPersonToIdb(person) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('people', person);
  } catch (error) {
    console.error(`Failed to persist person ${person.id}:`, error.message);
  }
}

// Delete a person from IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function deletePersonFromIdb(id) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.delete('people', id);
  } catch (error) {
    console.error(`Failed to delete person ${id}:`, error.message);
  }
}

// Fetch a single note from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getNoteFromIdb(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('notes', id);
}

// Fetch all notes for a project from IDB. Returns empty array if none exist.
// In Node.js test environment where IDB is unavailable, returns empty array.
export async function getNotesByProjectIdFromIdb(projectId) {
  const database = await getDatabase();
  if (!database) return [];
  const notes = await database.getAll('notes');
  return (notes || []).filter(note => note.projectId === projectId);
}

// Save a note to IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function putNoteToIdb(note) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('notes', note);
  } catch (error) {
    console.error(`Failed to persist note ${note.id}:`, error.message);
  }
}

// Delete a note from IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function deleteNoteFromIdb(id) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.delete('notes', id);
  } catch (error) {
    console.error(`Failed to delete note ${id}:`, error.message);
  }
}

// Fetch a single setting from IDB. Returns undefined if not found.
// In Node.js test environment where IDB is unavailable, returns undefined.
export async function getSettingFromIdb(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('settings', id);
}

// Save a setting to IDB. Fire-and-forget; errors logged to console.
// In Node.js test environment where IDB is unavailable, returns immediately.
export async function putSettingToIdb(setting) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('settings', setting);
  } catch (error) {
    console.error(`Failed to persist setting ${setting.id}:`, error.message);
  }
}

// Migrate existing projects to add missing notes and link fields
// Returns number of projects that were migrated
export async function migrateProjectFields() {
  const database = await getDatabase();
  if (!database) return 0;

  try {
    const projects = await database.getAll('projects');
    let migrationCount = 0;

    for (const project of projects) {
      let needsUpdate = false;

      if (project.notes === undefined) {
        project.notes = '';
        needsUpdate = true;
      }
      if (project.link === undefined) {
        project.link = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await database.put('projects', project);
        migrationCount++;
      }
    }

    return migrationCount;
  } catch (error) {
    console.error('Failed to migrate projects:', error.message);
    return 0;
  }
}

// Export promise that resolves when idb module is ready
export { idbReady };
