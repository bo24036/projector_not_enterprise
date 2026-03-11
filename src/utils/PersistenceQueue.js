// Shared persistence queue for write-through IDB operations.
// Prevents "last write wins" race conditions by queuing writes per ID.

export function createPersistenceQueue(idbFns, entityType) {
  const writeQueue = new Map(); // Tracks queued IDs to prevent concurrent writes

  return function queueWrite(entity, operation) {
    const id = entity.id;

    // If this ID is already queued, update it and let the current microtask handle the final state
    if (writeQueue.has(id)) {
      writeQueue.set(id, { entity, operation });
      return;
    }

    // Mark this ID as queued
    writeQueue.set(id, { entity, operation });

    // Schedule the actual write as a microtask
    queueMicrotask(async () => {
      const queued = writeQueue.get(id);
      if (!queued) return;

      writeQueue.delete(id);

      try {
        if (queued.operation === 'delete') {
          await idbFns.delete(queued.entity.id);
        } else {
          await idbFns.put(queued.entity);
        }
      } catch (error) {
        console.error(`[PersistenceQueue] Error persisting ${entityType} ${id}:`, error.message);
      }
    });
  };
}
