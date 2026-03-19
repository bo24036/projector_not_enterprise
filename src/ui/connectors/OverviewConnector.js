import { html, render } from '/vendor/lit-html/lit-html.js';
import { OverviewPage } from '../components/OverviewPage.js';
import * as Project from '../../domains/Project.js';
import * as Task from '../../domains/Task.js';
import { dispatch } from '../../state.js';
import { navigateToProject, navigateToPersonal } from '../../utils/router.js';
import { makeTaskDisplayObject } from '../../utils/taskFormatting.js';

export function initOverviewConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Get all non-archived, non-held projects
  const projects = Project.getAllProjects().filter(p => !p.archived && !p.heldAt);

  // Get personal tasks (incomplete only)
  const personalTasks = Task.getPersonalTasks()
    .filter(task => !task.completed)
    .map(task => makeTaskDisplayObject(task, {
      onToggle: () => {
        dispatch({ type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: task.id } });
      },
    }));

  // For each project, get incomplete tasks and pre-format dates
  const projectsWithTasks = projects.map(project => {
    const allTasks = Task.getTasksByProjectId(project.id) || [];
    const incompleteTasks = allTasks
      .filter(task => !task.completed)
      .map(task => makeTaskDisplayObject(task, {
        onToggle: () => {
          dispatch({ type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: task.id } });
        },
      }));

    return {
      project,
      incompleteTasks,
      onProjectClick: () => {
        navigateToProject(project.id);
      },
    };
  });

  const template = html`${OverviewPage({ personalTasks, projects: projectsWithTasks })}`;

  render(template, container);
}
