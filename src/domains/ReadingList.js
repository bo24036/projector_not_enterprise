/**
 * ReadingList Domain
 *
 * CACHE LOADING STRATEGY: EAGER (all items loaded at startup)
 * Rationale: Reading list is a global (non-project-scoped) list. Like Projects,
 * it must be available immediately for sidebar unread count and page rendering.
 * preloadAll() is called in main.js before router init.
 *
 * Schema: content (required, free text), link (optional, plain URL or [label](url)),
 * recommendedBy (optional, autocomplete), read (boolean).
 * No separate title field — content serves as both title and notes.
 */

import {
  getAllReadingListItemsFromIdb,
  putReadingListItemToIdb,
  deleteReadingListItemFromIdb,
} from '../utils/IdbService.js';
import { createPersistenceQueue } from '../utils/PersistenceQueue.js';
import { generateId } from '../utils/idGenerator.js';
import { normalizeLinkField, parseLinkField } from '../utils/linkUtils.js';

export { parseLinkField };

const cache = new Map();

const ERROR_ITEM_NOT_FOUND = 'Reading list item not found';
const ERROR_CONTENT_REQUIRED = 'Content is required';

const serialize = createPersistenceQueue(
  {
    put: putReadingListItemToIdb,
    delete: deleteReadingListItemFromIdb,
  },
  'readingList'
);

// Load all items from IDB into the cache at startup.
export async function preloadAll() {
  const items = await getAllReadingListItemsFromIdb();
  for (const item of items) {
    cache.set(item.id, item);
  }
}

// Factory: create and persist a new reading list item.
// content is required. overrides may include link, recommendedBy.
export function createReadingListItem(content, overrides = {}) {
  const trimmedContent = content?.trim();
  if (!trimmedContent) throw new Error(ERROR_CONTENT_REQUIRED);

  const now = new Date().toISOString();
  const item = {
    id: generateId('rl'),
    content: trimmedContent,
    link: normalizeLinkField(overrides.link ?? ''),
    recommendedBy: overrides.recommendedBy?.trim() ?? '',
    read: false,
    createdAt: now,
    updatedAt: now,
  };

  cache.set(item.id, item);
  serialize(item, 'put');
  return item;
}

// Synchronous cache lookup. Returns undefined if not found.
export function getReadingListItem(id) {
  return cache.get(id);
}

// Returns all items sorted newest-first by createdAt.
export function getAllReadingListItems() {
  return [...cache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Update an existing item. Allowed fields: content, link, recommendedBy.
export function updateReadingListItem(id, updates) {
  const item = cache.get(id);
  if (!item) throw new Error(ERROR_ITEM_NOT_FOUND);

  const updated = { ...item, updatedAt: new Date().toISOString() };

  if (updates.content !== undefined) {
    const c = updates.content.trim();
    if (!c) throw new Error(ERROR_CONTENT_REQUIRED);
    updated.content = c;
  }
  if (updates.link !== undefined) updated.link = normalizeLinkField(updates.link);
  if (updates.recommendedBy !== undefined) updated.recommendedBy = updates.recommendedBy.trim();

  cache.set(id, updated);
  serialize(updated, 'put');
  return updated;
}

// Mark an item as read.
export function markRead(id) {
  const item = cache.get(id);
  if (!item) throw new Error(ERROR_ITEM_NOT_FOUND);
  const updated = { ...item, read: true, updatedAt: new Date().toISOString() };
  cache.set(id, updated);
  serialize(updated, 'put');
  return updated;
}

// Mark an item as unread.
export function markUnread(id) {
  const item = cache.get(id);
  if (!item) throw new Error(ERROR_ITEM_NOT_FOUND);
  const updated = { ...item, read: false, updatedAt: new Date().toISOString() };
  cache.set(id, updated);
  serialize(updated, 'put');
  return updated;
}

// Delete an item from cache and IDB.
export function deleteReadingListItem(id) {
  if (!cache.has(id)) throw new Error(ERROR_ITEM_NOT_FOUND);
  const item = cache.get(id);
  cache.delete(id);
  serialize(item, 'delete');
}

// Returns a sorted, deduplicated list of all past recommendedBy values (non-empty).
export function getRecommenderOptions() {
  const seen = new Set();
  for (const item of cache.values()) {
    if (item.recommendedBy) seen.add(item.recommendedBy);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

// Testing utility only.
export function _resetCacheForTesting() {
  cache.clear();
}
