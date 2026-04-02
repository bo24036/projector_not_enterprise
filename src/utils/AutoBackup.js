// AutoBackup: silently writes projector-backup.json to a user-chosen folder.
//
// The user picks a folder once (via the Settings modal). The FileSystemDirectoryHandle
// is persisted in IDB so it survives restarts. On each setState(), scheduleBackup()
// snapshots all in-memory domain caches synchronously — capturing the consistent
// post-handler state before async IDB writes complete — then debounces the actual
// file write by 30 seconds.

import { getBackupDirHandle, putBackupDirHandle, getAllSettings } from './IdbService.js';
import { getAllProjects } from '../domains/Project.js';
import { snapshotCache as snapshotTasks } from '../domains/Task.js';
import { snapshotCache as snapshotPeople } from '../domains/Person.js';
import { snapshotCache as snapshotNotes } from '../domains/Note.js';
import { getAllReadingListItems } from '../domains/ReadingList.js';

const EXPORT_VERSION = 1;
const DEBOUNCE_MS = 30_000;

let dirHandle = null;
let debounceTimer = null;
let pendingSnapshot = null;

// Load saved directory handle from IDB. Called once at startup.
// Does not request permission — that requires a user gesture; handled lazily in writeBackup().
export async function initAutoBackup() {
  dirHandle = await getBackupDirHandle();
}

// Returns the name of the configured backup folder, or null if none set.
export function getDirName() {
  return dirHandle?.name ?? null;
}

// Opens the OS directory picker, saves the chosen handle, then schedules an immediate backup.
// Throws AbortError if user cancels — callers should handle that case.
export async function setBackupDir() {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  dirHandle = handle;
  await putBackupDirHandle(handle);
  scheduleBackup();
}

// Snapshots all in-memory caches synchronously, then debounces the file write.
// Safe to call on every setState() — no-op if no folder is configured.
export function scheduleBackup() {
  if (!dirHandle) return;

  // Snapshot now — synchronous read of in-memory caches, consistent across all domains.
  // This must happen before any async IDB writes that the handler queued.
  pendingSnapshot = {
    projects: getAllProjects(),
    tasks: snapshotTasks(),
    people: snapshotPeople(),
    notes: snapshotNotes(),
    readingList: getAllReadingListItems(),
  };

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(writeBackup, DEBOUNCE_MS);
}

async function writeBackup() {
  if (!dirHandle || !pendingSnapshot) return;

  const snapshot = pendingSnapshot;
  pendingSnapshot = null;

  // Re-request permission if needed (Chrome may revoke after restart).
  let permission = await dirHandle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted') {
    permission = await dirHandle.requestPermission({ mode: 'readwrite' });
  }
  if (permission !== 'granted') return; // User denied — skip silently.

  try {
    // Settings are low-churn; reading from IDB at write time has negligible race risk.
    const settings = await getAllSettings();

    const payload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: { ...snapshot, settings },
    };

    const fileHandle = await dirHandle.getFileHandle('projector-backup.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
  } catch (error) {
    console.error('[AutoBackup] Backup failed:', error.message);
  }
}
