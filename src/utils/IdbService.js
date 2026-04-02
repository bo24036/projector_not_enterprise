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

  db = await openDB('projector', 6, {
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
      if (!db.objectStoreNames.contains('readingList')) {
        db.createObjectStore('readingList', { keyPath: 'id' });
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

// Fetch all tasks from IDB. Returns empty array if none exist.
export async function getAllTasks() {
  const database = await getDatabase();
  if (!database) return [];
  return (await database.getAll('tasks')) || [];
}

// Fetch all people from IDB. Returns empty array if none exist.
export async function getAllPeople() {
  const database = await getDatabase();
  if (!database) return [];
  return (await database.getAll('people')) || [];
}

// Fetch all notes from IDB. Returns empty array if none exist.
export async function getAllNotes() {
  const database = await getDatabase();
  if (!database) return [];
  return (await database.getAll('notes')) || [];
}

// Fetch all settings from IDB. Returns empty array if none exist.
export async function getAllSettings() {
  const database = await getDatabase();
  if (!database) return [];
  return (await database.getAll('settings')) || [];
}

// Fetch a single reading list item from IDB. Returns undefined if not found.
export async function getReadingListItemFromIdb(id) {
  const database = await getDatabase();
  if (!database) return undefined;
  return database.get('readingList', id);
}

// Fetch all reading list items from IDB. Returns empty array if none exist.
export async function getAllReadingListItemsFromIdb() {
  const database = await getDatabase();
  if (!database) return [];
  return (await database.getAll('readingList')) || [];
}

// Save a reading list item to IDB. Fire-and-forget; errors logged to console.
export async function putReadingListItemToIdb(item) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.put('readingList', item);
  } catch (error) {
    console.error(`Failed to persist reading list item ${item.id}:`, error.message);
  }
}

// Delete a reading list item from IDB. Fire-and-forget; errors logged to console.
export async function deleteReadingListItemFromIdb(id) {
  const database = await getDatabase();
  if (!database) return;

  try {
    await database.delete('readingList', id);
  } catch (error) {
    console.error(`Failed to delete reading list item ${id}:`, error.message);
  }
}

// Fetch the saved backup directory handle from IDB. Returns undefined if not set.
export async function getBackupDirHandle() {
  const database = await getDatabase();
  if (!database) return undefined;
  const row = await database.get('settings', 'backup-dir-handle');
  return row?.value;
}

// Save a FileSystemDirectoryHandle to IDB. Handles are structured-cloneable.
export async function putBackupDirHandle(handle) {
  const database = await getDatabase();
  if (!database) return;
  await database.put('settings', { id: 'backup-dir-handle', value: handle });
}

// Clear all records from a store. Used during import.
export async function clearStore(storeName) {
  const database = await getDatabase();
  if (!database) return;
  await database.clear(storeName);
}

// Export promise that resolves when idb module is ready
export { idbReady };
