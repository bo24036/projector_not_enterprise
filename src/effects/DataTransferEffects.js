import { dispatch } from '../state.js';
import * as IdbService from '../utils/IdbService.js';
import * as Project from '../domains/Project.js';
import * as Person from '../domains/Person.js';
import * as Settings from '../domains/Settings.js';
import * as ReadingList from '../domains/ReadingList.js';
import { setBackupDir } from '../utils/AutoBackup.js';

const EXPORT_VERSION = 1;
const STORES = ['projects', 'tasks', 'people', 'notes', 'settings', 'readingList'];

export async function exportData() {
  try {
    const [projects, tasks, people, notes, settings, readingList] = await Promise.all([
      IdbService.getAllProjects(),
      IdbService.getAllTasks(),
      IdbService.getAllPeople(),
      IdbService.getAllNotes(),
      IdbService.getAllSettings(),
      IdbService.getAllReadingListItemsFromIdb(),
    ]);

    const payload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: { projects, tasks, people, notes, settings, readingList },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projector-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: { actionType: 'EXPORT_DATA', message: `Export failed: ${error.message}` },
    });
  }
}

export async function importData(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    if (!payload.version || !payload.data) {
      throw new Error('Invalid export file format.');
    }

    const { projects = [], tasks = [], people = [], notes = [], settings = [], readingList = [] } = payload.data;

    // Clear all stores first
    await Promise.all(STORES.map(store => IdbService.clearStore(store)));

    // Write all records
    await Promise.all([
      ...projects.map(r => IdbService.putProject(r)),
      ...tasks.map(r => IdbService.putTask(r)),
      ...people.map(r => IdbService.putPersonToIdb(r)),
      ...notes.map(r => IdbService.putNoteToIdb(r)),
      ...settings.map(r => IdbService.putSettingToIdb(r)),
      ...readingList.map(r => IdbService.putReadingListItemToIdb(r)),
    ]);

    // Reload all domain caches from fresh IDB state
    await Project.reloadAllProjects();
    await Person.reloadAllPeople();
    await Person.reloadSuppressedNames();
    await Settings.preloadSettings();
    await ReadingList.preloadAll();

    dispatch({ type: 'IMPORT_COMPLETE' });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: { actionType: 'IMPORT_DATA', message: `Import failed: ${error.message}` },
    });
  }
}

export async function setBackupDirEffect() {
  try {
    await setBackupDir();
    dispatch({ type: 'BACKUP_DIR_SET' });
  } catch (error) {
    if (error.name !== 'AbortError') { // AbortError = user cancelled picker, not an error
      dispatch({
        type: 'SET_ERROR',
        payload: { actionType: 'SET_BACKUP_DIR', message: `Could not set backup folder: ${error.message}` },
      });
    }
  }
}
