/**
 * Task Domain
 *
 * CACHE LOADING STRATEGY: LAZY (tasks loaded on-demand via cache-miss pattern)
 * Rationale: Tasks are only needed when a specific project is selected. Lazy loading via
 * cache-miss pattern is acceptable because:
 * 1. TaskListConnector uses skeleton pattern while tasks are loading
 * 2. Tasks are not required for initial page load or sidebar rendering
 * 3. Reduces startup time and memory footprint
 *
 * Cache-miss flow: get(id) returns undefined synchronously → queues async fetch from IDB →
 * fetch completes and populates cache → dispatch TASK_LOADED → connector re-renders with fresh data
 *
 * Contrast with Project domain: Projects must be eager-loaded because sidebar needs complete
 * list immediately, and router must know if project is archived on initial navigation.
 */

// Import dispatch from local module (always available)
import { dispatch } from '../state.js';

// Import IDB operations from service layer
import { getTask as getTaskFromIdb, getTasksByProjectId as getTasksByProjectIdFromIdb, getPersonalTasksFromIdb, putTask as putTaskToIdb, deleteTask as deleteTaskFromIdb } from '../utils/IdbService.js';
import { createPersistenceQueue } from '../utils/PersistenceQueue.js';
import { generateId } from '../utils/idGenerator.js';

const taskCache = new Map();
const projectIdIndex = new Map(); // Map of projectId -> Set of taskIds

const ERROR_TASK_NOT_FOUND = 'Task not found';

// Get today's date normalized to midnight (no time component)
function getNormalizedToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Create persistence queue for write-through IDB operations
const serialize = createPersistenceQueue(
  {
    put: putTaskToIdb,
    delete: deleteTaskFromIdb,
  },
  'task'
);

// Helper: add business days (Mon-Fri) to a date
function addBusinessDays(startDate, businessDays) {
  const date = new Date(startDate);
  let count = 0;

  while (count < businessDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return date;
}

// Parse due date from string: "+5", "tomorrow", "2025-02-25"
function parseDueDate(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim().toLowerCase();

  const now = new Date();
  const today = getNormalizedToday();

  // "+5" = 5 business days from now (check first, before numeric timestamp check)
  if (trimmed.startsWith('+')) {
    const days = parseInt(trimmed.substring(1), 10);
    if (!isNaN(days)) {
      const date = addBusinessDays(today, days);
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
  const today = getNormalizedToday();
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
  const today = getNormalizedToday();

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
  const normalizedProjectId = projectId ?? null;

  const task = {
    id: generateId('task'),
    name: taskName,
    projectId: normalizedProjectId,
    completed: false,
    dueDate,
    parentTaskId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  taskCache.set(task.id, task);

  // Index by projectId
  if (!projectIdIndex.has(normalizedProjectId)) {
    projectIdIndex.set(normalizedProjectId, new Set());
  }
  projectIdIndex.get(normalizedProjectId).add(task.id);

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

export function getPersonalTasks() {
  return getTasksByProjectId(null);
}

export function getOpenTaskCount(projectId) {
  return getTasksByProjectId(projectId).filter(t => !t.completed).length;
}

const URGENCY_RANK = { red: 0, orange: 1, yellow: 2, gray: 3 };

export function getProjectUrgency(projectId) {
  const tasks = getTasksByProjectId(projectId).filter(t => !t.completed && t.dueDate);
  if (tasks.length === 0) return 'gray';
  return tasks.reduce((worst, task) => {
    const u = getUrgency(task.dueDate);
    return URGENCY_RANK[u] < URGENCY_RANK[worst] ? u : worst;
  }, 'gray');
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
