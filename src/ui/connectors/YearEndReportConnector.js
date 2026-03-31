import { html, render } from '/vendor/lit-html/lit-html.js';
import { YearEndReportPage } from '../components/YearEndReportPage.js';
import * as Project from '../../domains/Project.js';
import * as Task from '../../domains/Task.js';
import { dispatch } from '../../state.js';
import { navigateToProject } from '../../utils/router.js';

function getProjectsActiveInYear(allProjects, year) {
  const janFirst = new Date(year, 0, 1).getTime();
  const dec31End = new Date(year, 11, 31, 23, 59, 59, 999).getTime();

  return allProjects.filter(project => {
    const createdAt = new Date(project.createdAt).getTime();

    // Must have been created on or before Dec 31 of the target year
    if (createdAt > dec31End) return false;

    // If never archived, it was active during the year (still ongoing)
    if (!project.archived || !project.archivedAt) return true;

    // If archived, it must have been archived on or after Jan 1 of the target year
    const archivedAt = new Date(project.archivedAt).getTime();
    return archivedAt >= janFirst;
  });
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function initYearEndReportConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const year = state.yearEndReportYear;
  const allProjects = Project.getAllProjects();
  const projects = getProjectsActiveInYear(allProjects, year);

  const rows = projects.map(project => {
    const tasks = Task.getTasksByProjectId(project.id);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      completedTasks: tasks.filter(t => t.completed).length,
      totalTasks: tasks.length,
      startDate: formatDate(project.createdAt),
      endDate: project.archivedAt ? formatDate(project.archivedAt) : 'Active',
      onProjectClick: () => navigateToProject(project.id),
    };
  });

  render(
    html`${YearEndReportPage({
      year,
      rows,
      onYearChange: (newYear) =>
        dispatch({ type: 'SET_YEAR_END_REPORT_YEAR', payload: { year: newYear } }),
    })}`,
    container
  );
}
