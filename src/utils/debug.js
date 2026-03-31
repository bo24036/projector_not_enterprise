import { getState, dispatch, getHandlerKeys } from '../state.js';
import * as Project from '../domains/Project.js';
import * as Task from '../domains/Task.js';
import * as Person from '../domains/Person.js';
import * as Note from '../domains/Note.js';
import * as Settings from '../domains/Settings.js';

async function fetchVersion() {
  const res = await fetch('/version.json?t=' + Date.now());
  if (!res.ok) return null;
  return res.json();
}

export function initDebug() {
  window.__projector = {
    // --- State ---
    getState,
    dispatch,
    getHandlers: getHandlerKeys,

    // --- Version ---
    getVersion: fetchVersion,

    // --- Projects ---
    getAllProjects: Project.getAllProjects,
    getProject: Project.getProject,

    // --- Tasks ---
    getTask: Task.getTask,
    getTasksByProjectId: Task.getTasksByProjectId,
    getPersonalTasks: Task.getPersonalTasks,
    getTaskCounts: () => {
      const projects = Project.getAllProjects();
      return projects.map(p => {
        const tasks = Task.getTasksByProjectId(p.id);
        return {
          id: p.id,
          name: p.name,
          total: tasks.length,
          completed: tasks.filter(t => t.completed).length,
          open: Task.getOpenTaskCount(p.id),
        };
      });
    },

    // --- People ---
    getPerson: Person.getPerson,
    getPeopleByProjectId: Person.getPeopleByProjectId,

    // --- Notes ---
    getNote: Note.getNote,
    getNotesByProjectId: Note.getNotesByProjectId,

    // --- Settings ---
    getSettings: () => ({
      holdReviewDays: Settings.getHoldReviewDays(),
    }),

    // --- Cache stats ---
    getCacheStats: () => {
      const projects = Project.getAllProjects();
      const taskCounts = projects.map(p => Task.getTasksByProjectId(p.id).length);
      const peopleCounts = projects.map(p => Person.getPeopleByProjectId(p.id).length);
      const noteCounts = projects.map(p => Note.getNotesByProjectId(p.id).length);
      return {
        projects: projects.length,
        tasks: taskCounts.reduce((a, b) => a + b, 0),
        people: peopleCounts.reduce((a, b) => a + b, 0),
        notes: noteCounts.reduce((a, b) => a + b, 0),
      };
    },

    // --- Convenience ---
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };

  console.info('Projector debug tools available at window.__projector');
}
