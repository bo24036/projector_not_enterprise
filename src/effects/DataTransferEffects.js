import { dispatch } from '../state.js';
import * as IdbService from '../utils/IdbService.js';
import * as Project from '../domains/Project.js';
import * as Person from '../domains/Person.js';
import * as Settings from '../domains/Settings.js';

const EXPORT_VERSION = 1;
const STORES = ['projects', 'tasks', 'people', 'notes', 'settings'];

export async function exportData() {
  try {
    const [projects, tasks, people, notes, settings] = await Promise.all([
      IdbService.getAllProjects(),
      IdbService.getAllTasks(),
      IdbService.getAllPeople(),
      IdbService.getAllNotes(),
      IdbService.getAllSettings(),
    ]);

    const payload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: { projects, tasks, people, notes, settings },
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

    const { projects = [], tasks = [], people = [], notes = [], settings = [] } = payload.data;

    // Clear all stores first
    await Promise.all(STORES.map(store => IdbService.clearStore(store)));

    // Write all records
    await Promise.all([
      ...projects.map(r => IdbService.putProject(r)),
      ...tasks.map(r => IdbService.putTask(r)),
      ...people.map(r => IdbService.putPersonToIdb(r)),
      ...notes.map(r => IdbService.putNoteToIdb(r)),
      ...settings.map(r => IdbService.putSettingToIdb(r)),
    ]);

    // Reload all domain caches from fresh IDB state
    await Project.reloadAllProjects();
    await Person.reloadAllPeople();
    await Person.reloadSuppressedNames();
    await Settings.preloadSettings();

    dispatch({ type: 'IMPORT_COMPLETE' });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: { actionType: 'IMPORT_DATA', message: `Import failed: ${error.message}` },
    });
  }
}
