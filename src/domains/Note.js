/**
 * Note Domain
 *
 * CACHE LOADING STRATEGY: LAZY (notes loaded on-demand via cache-miss pattern)
 * Rationale: Notes are only needed when a specific project is selected. Lazy loading via
 * cache-miss pattern is acceptable because:
 * 1. NoteListConnector uses skeleton pattern while notes are loading
 * 2. Notes are not required for initial page load or sidebar rendering
 * 3. Reduces startup time and memory footprint
 *
 * Cache-miss flow: get(id) returns undefined synchronously → queues async fetch from IDB →
 * fetch completes and populates cache → dispatch NOTE_LOADED → connector re-renders with fresh data
 */

import { dispatch } from '../state.js';
import { getNoteFromIdb, getNotesByProjectIdFromIdb, getAllNotes as getAllNotesFromIdb, putNoteToIdb, deleteNoteFromIdb } from '../utils/IdbService.js';
import { createPersistenceQueue } from '../utils/PersistenceQueue.js';
import { generateId } from '../utils/idGenerator.js';
import { normalizeLinkField, parseLinkField } from '../utils/linkUtils.js';

export { parseLinkField };

const noteCache = new Map();
const projectIdIndex = new Map(); // Map of projectId -> Set of noteIds

const ERROR_NOTE_NOT_FOUND = 'Note not found';

const serialize = createPersistenceQueue(
  {
    put: putNoteToIdb,
    delete: deleteNoteFromIdb,
  },
  'note'
);

export function createNote(projectId, content, link) {
  if (!projectId) {
    throw new Error('Note must belong to a project');
  }

  const noteContent = (content || '').trim();
  if (!noteContent) {
    throw new Error('Note content cannot be empty');
  }

  const note = {
    id: generateId('note'),
    projectId,
    content: noteContent,
    link: normalizeLinkField(link),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  noteCache.set(note.id, note);

  if (!projectIdIndex.has(projectId)) {
    projectIdIndex.set(projectId, new Set());
  }
  projectIdIndex.get(projectId).add(note.id);

  serialize(note, 'put');
  return note;
}

export function getNote(id) {
  const cached = noteCache.get(id);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss: queue async fetch from IDB (fire-and-forget)
  queueMicrotask(async () => {
    try {
      const note = await getNoteFromIdb(id);
      if (note) {
        noteCache.set(note.id, note);
        if (!projectIdIndex.has(note.projectId)) {
          projectIdIndex.set(note.projectId, new Set());
        }
        projectIdIndex.get(note.projectId).add(id);
        if (dispatch) {
          dispatch({ type: 'NOTE_LOADED', payload: { note } });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch note ${id}:`, error.message);
    }
  });

  return undefined;
}

export function getNotesByProjectId(projectId) {
  const noteIds = projectIdIndex.get(projectId) || new Set();
  const notes = Array.from(noteIds)
    .map(id => noteCache.get(id))
    .filter(note => note !== undefined);

  // Cache miss: queue async fetch from IDB (fire-and-forget)
  if (notes.length === 0 && !projectIdIndex.has(projectId)) {
    queueMicrotask(async () => {
      try {
        const projectNotes = await getNotesByProjectIdFromIdb(projectId);
        if (projectNotes && projectNotes.length > 0) {
          if (!projectIdIndex.has(projectId)) {
            projectIdIndex.set(projectId, new Set());
          }
          const noteIdSet = projectIdIndex.get(projectId);
          for (const note of projectNotes) {
            noteCache.set(note.id, note);
            noteIdSet.add(note.id);
          }
          if (dispatch) {
            dispatch({ type: 'NOTE_LOADED', payload: { notes: projectNotes } });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch notes for project ${projectId}:`, error.message);
      }
    });
  }

  // Sort by createdAt ascending (oldest first)
  return notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function updateNote(id, updates) {
  const note = noteCache.get(id);
  if (!note) {
    throw new Error(ERROR_NOTE_NOT_FOUND);
  }

  if (updates.content !== undefined) {
    const trimmed = updates.content.trim();
    if (!trimmed) {
      throw new Error('Note content cannot be empty');
    }
    note.content = trimmed;
  }

  if (updates.link !== undefined) {
    note.link = normalizeLinkField(updates.link);
  }

  note.updatedAt = new Date().toISOString();
  serialize(note, 'put');
  return note;
}

export function deleteNote(id) {
  const note = noteCache.get(id);
  if (!note) {
    throw new Error(ERROR_NOTE_NOT_FOUND);
  }

  noteCache.delete(id);
  const projectNotes = projectIdIndex.get(note.projectId);
  if (projectNotes) {
    projectNotes.delete(id);
  }

  serialize(note, 'delete');
  return true;
}

// Returns a snapshot of all notes currently in the in-memory cache.
export function snapshotCache() { return Array.from(noteCache.values()); }

// Eagerly loads all notes from IDB into cache. Called at startup before router init
// so notes are available synchronously on first render (same pattern as Projects/People).
export async function preloadAll() {
  try {
    const notes = await getAllNotesFromIdb();
    for (const note of notes) {
      noteCache.set(note.id, note);
      if (!projectIdIndex.has(note.projectId)) {
        projectIdIndex.set(note.projectId, new Set());
      }
      projectIdIndex.get(note.projectId).add(note.id);
    }
  } catch (error) {
    console.error('Failed to preload notes:', error.message);
  }
}

// Test utility - clears cache and resets state
export function _resetCacheForTesting() {
  noteCache.clear();
  projectIdIndex.clear();
}
