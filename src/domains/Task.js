// Import dispatch from local module (always available)
import { dispatch } from '../state.js';

// Import IDB operations from service layer
import { getTask as getTaskFromIdb, getTasksByProjectId as getTasksByProjectIdFromIdb, putTask as putTaskToIdb, deleteTask as deleteTaskFromIdb } from '../services/IdbService.js';

const taskCache = new Map();
const projectIdIndex = new Map(); // Map of projectId -> Set of taskIds
const writeQueue = new Map();

const ERROR_TASK_NOT_FOUND = 'Task not found';

// Generate a GUID for unique task IDs
function generateId() {
  return 'task_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Queue a write to IDB with deduplication
function serialize(task, operation) {
  const id = task.id;

  if (writeQueue.has(id)) {
    writeQueue.set(id, { task, operation });
    return;
  }

  writeQueue.set(id, { task, operation });

  queueMicrotask(async () => {
    const queued = writeQueue.get(id);
    if (!queued) return;

    writeQueue.delete(id);

    try {
      if (queued.operation === 'delete') {
        await deleteTaskFromIdb(queued.task.id);
      } else {
        await putTaskToIdb(queued.task);
      }
    } catch (error) {
      console.error(`[Task.serialize] Error persisting task ${id}:`, error.message);
    }
  });
}

// Parse due date from string: "+5", "tomorrow", "2025-02-25"
function parseDueDate(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim().toLowerCase();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // "+5" = 5 days from now (check first, before numeric timestamp check)
  if (trimmed.startsWith('+')) {
    const days = parseInt(trimmed.substring(1), 10);
    if (!isNaN(days)) {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.getTime();
    }
  }

  // "tomorrow"
  if (trimmed === 'tomorrow') {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date.getTime();
  }

  // "today"
  if (trimmed === 'today') {
    return today.getTime();
  }

  // "YYYY-MM-DD" or "MM/DD" or "MM/DD/YYYY"
  let date;
  if (trimmed.includes('-') && !trimmed.startsWith('-')) {
    // YYYY-MM-DD (but not negative numbers)
    const [year, month, day] = trimmed.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      date = new Date(year, month - 1, day);
      return date.getTime();
    }
  } else if (trimmed.includes('/')) {
    // MM/DD or MM/DD/YYYY
    const parts = trimmed.split('/').map(Number);
    if (parts.length === 2) {
      const [month, day] = parts;
      const year = now.getFullYear();
      date = new Date(year, month - 1, day);
      return date.getTime();
    } else if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
      return date.getTime();
    }
  }

  // Numeric timestamp (as string)
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return null;
}

// Format due date for display
export function formatDueDate(timestamp) {
  if (!timestamp) return null;

  const dueDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = dueDateNormalized.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  } else if (diffDays === 0) {
    return 'due today';
  } else if (diffDays === 1) {
    return 'due tomorrow';
  } else if (diffDays <= 7) {
    return `due in ${diffDays} days`;
  } else {
    return `${dueDate.toLocaleDateString()}`;
  }
}

// Get urgency color for overview page
export function getUrgency(timestamp) {
  if (!timestamp) return 'gray';

  const dueDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffTime = dueDateNormalized.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays === 0 || diffDays === 1) {
    return 'red';
  } else if (diffDays === 2) {
    return 'orange';
  } else if (diffDays === 3) {
    return 'yellow';
  } else {
    return 'gray';
  }
}

export function createTask(projectId, name, dueDateInput) {
  const taskName = (name || '').trim();

  if (!taskName) {
    throw new Error('Task name cannot be empty');
  }

  const dueDate = dueDateInput ? parseDueDate(dueDateInput) : null;

  const task = {
    id: generateId(),
    name: taskName,
    projectId,
    completed: false,
    dueDate,
    parentTaskId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  taskCache.set(task.id, task);

  // Index by projectId
  if (!projectIdIndex.has(projectId)) {
    projectIdIndex.set(projectId, new Set());
  }
  projectIdIndex.get(projectId).add(task.id);

  serialize(task, 'put');
  return task;
}

export function getTask(id) {
  const cached = taskCache.get(id);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss: queue async fetch from IDB (fire-and-forget)
  queueMicrotask(async () => {
    try {
      const task = await getTaskFromIdb(id);
      if (task) {
        taskCache.set(id, task);
        if (!projectIdIndex.has(task.projectId)) {
          projectIdIndex.set(task.projectId, new Set());
        }
        projectIdIndex.get(task.projectId).add(id);
        if (dispatch) {
          dispatch({ type: 'TASK_LOADED', payload: { task } });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error.message);
    }
  });

  return undefined;
}

export function getTasksByProjectId(projectId) {
  const taskIds = projectIdIndex.get(projectId) || new Set();
  const tasks = Array.from(taskIds)
    .map(id => taskCache.get(id))
    .filter(task => task !== undefined);

  // Cache miss: queue async fetch from IDB (fire-and-forget)
  if (tasks.length === 0 && !projectIdIndex.has(projectId)) {
    queueMicrotask(async () => {
      try {
        const projectTasks = await getTasksByProjectIdFromIdb(projectId);
        if (projectTasks && projectTasks.length > 0) {
          // Load tasks into cache
          if (!projectIdIndex.has(projectId)) {
            projectIdIndex.set(projectId, new Set());
          }
          const taskIdSet = projectIdIndex.get(projectId);
          for (const task of projectTasks) {
            taskCache.set(task.id, task);
            taskIdSet.add(task.id);
          }
          if (dispatch) {
            dispatch({ type: 'TASK_LOADED', payload: { tasks: projectTasks } });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch tasks for project ${projectId}:`, error.message);
      }
    });
  }

  // Sort by dueDate (soonest first), then tasks without due dates
  return tasks.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return a.dueDate - b.dueDate;
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function updateTask(id, updates) {
  const task = getTask(id);
  if (!task) {
    throw new Error(ERROR_TASK_NOT_FOUND);
  }

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      throw new Error('Task name cannot be empty');
    }
    task.name = trimmed;
  }

  if (updates.dueDate !== undefined) {
    task.dueDate = updates.dueDate ? parseDueDate(updates.dueDate) : null;
  }

  if (updates.completed !== undefined) {
    task.completed = updates.completed;
  }

  task.updatedAt = new Date().toISOString();
  serialize(task, 'put');
  return task;
}

export function toggleTaskCompleted(id) {
  const task = getTask(id);
  if (!task) {
    throw new Error(ERROR_TASK_NOT_FOUND);
  }

  task.completed = !task.completed;
  task.updatedAt = new Date().toISOString();
  serialize(task, 'put');
  return task;
}

export function deleteTask(id) {
  const task = getTask(id);
  if (!task) {
    throw new Error(ERROR_TASK_NOT_FOUND);
  }

  taskCache.delete(id);
  const projectTasks = projectIdIndex.get(task.projectId);
  if (projectTasks) {
    projectTasks.delete(id);
  }

  serialize(task, 'delete');
  return true;
}

// Test utility - clears cache and resets state
export function _resetCacheForTesting() {
  taskCache.clear();
  projectIdIndex.clear();
}
