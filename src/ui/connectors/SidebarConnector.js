import { html, render } from '/vendor/lit-html/lit-html.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectNewItem } from '../components/ProjectNewItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import { SuppressNamesModal } from '../components/SuppressNamesModal.js';
import * as Project from '../../domains/Project.js';
import * as Task from '../../domains/Task.js';
import * as Person from '../../domains/Person.js';
import { dispatch } from '../../state.js';
import { navigateToProject, navigateToOverview, navigateToPersonal } from '../../utils/router.js';

export function initSidebarConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const allProjects = Project.getAllProjects() || [];
  const activeProjects = allProjects.filter(p => !p.archived);
  const archivedProjects = allProjects.filter(p => p.archived);

  const personalTaskCount = Task.getOpenTaskCount(null);
  const overviewTaskCount = activeProjects.reduce((sum, p) => sum + Task.getOpenTaskCount(p.id), 0) + personalTaskCount;

  const URGENCY_RANK = { red: 0, orange: 1, yellow: 2, gray: 3 };
  const personalUrgency = Task.getProjectUrgency(null);
  const overviewUrgency = [...activeProjects.map(p => Task.getProjectUrgency(p.id)), personalUrgency]
    .reduce((worst, u) => URGENCY_RANK[u] < URGENCY_RANK[worst] ? u : worst, 'gray');

  const personalProgress = Task.getProjectProgress(null);
  const allOverviewTasks = [...activeProjects.flatMap(p => Task.getTasksByProjectId(p.id)), ...Task.getPersonalTasks()];
  const overviewProgress = allOverviewTasks.length === 0 ? null
    : Math.round(allOverviewTasks.filter(t => t.completed).length / allOverviewTasks.length * 100);

  const allNames = Person.getAllUniquePersonNamesRaw() || [];
  const suppressedNames = Person.getSuppressedNames();

  // Create new project item (Archive button)
  const newProjectItem = state.isCreatingProject
    ? ProjectInput({
        onSave: handleSave,
        onCancel: () => dispatch({ type: 'CANCEL_CREATE_PROJECT' }),
      })
    : ProjectNewItem({
        onStartCreate: () => dispatch({ type: 'START_CREATE_PROJECT' }),
      });

  // Render archived projects only if toggle is enabled and there are archived projects
  const archivedList = state.showArchivedProjects && archivedProjects.length > 0
    ? html`
      <div class="sidebar__archived-list">
        ${archivedProjects.map(project =>
          ProjectListItem({
            project,
            isSelected: state.currentProjectId === project.id,
            onSelect: () => navigateToProject(project.id),
          })
        )}
      </div>
    `
    : html``;

  const archivedToggleIndicator = state.showArchivedProjects ? '▼' : '▶';

  const template = html`
    <div class="sidebar">
      <div class="sidebar__header">
        <h1 class="sidebar__title">Projects</h1>
      </div>

      <button class="sidebar__overview-btn urgency-${overviewUrgency} ${state.currentPage === 'overview' ? 'is-active' : ''}" @click=${navigateToOverview}>
        Overview
        <span class="project-list-item__meta">
          ${overviewTaskCount > 0 ? html`<span class="sidebar__count">${overviewTaskCount}</span>` : ''}
          ${overviewProgress !== null ? html`<span class="project-progress-ring" style="--progress: ${overviewProgress}"></span>` : ''}
        </span>
      </button>

      <button class="sidebar__personal-btn urgency-${personalUrgency} ${state.currentPage === 'personal' ? 'is-active' : ''}" @click=${navigateToPersonal}>
        My Tasks
        <span class="project-list-item__meta">
          ${personalTaskCount > 0 ? html`<span class="sidebar__count">${personalTaskCount}</span>` : ''}
          ${personalProgress !== null ? html`<span class="project-progress-ring" style="--progress: ${personalProgress}"></span>` : ''}
        </span>
      </button>

      <div class="sidebar__list">
        ${activeProjects.map(project =>
          ProjectListItem({
            project,
            isSelected: state.currentProjectId === project.id,
            openTaskCount: Task.getOpenTaskCount(project.id),
            urgency: Task.getProjectUrgency(project.id),
            progress: Task.getProjectProgress(project.id),
            onSelect: () => navigateToProject(project.id),
          })
        )}
        ${newProjectItem}
      </div>

      <div class="sidebar__archived-section">
        <button class="sidebar__archived-header" @click=${() => dispatch({ type: 'TOGGLE_ARCHIVED_PROJECTS' })}>
          <span class="sidebar__archived-indicator">${archivedToggleIndicator}</span>
          Archived
        </button>
        ${archivedList}
      </div>

      <div class="sidebar__footer">
        <button class="sidebar__suppress-btn"
          @click=${() => dispatch({ type: 'OPEN_SUPPRESS_NAMES_MODAL' })}>
          Suppress Names
        </button>
      </div>
    </div>

    ${state.showSuppressNamesModal
      ? SuppressNamesModal({
          allNames,
          suppressedNames,
          onSave: (names) => dispatch({ type: 'UPDATE_SUPPRESSED_NAMES', payload: { names } }),
          onClose: () => dispatch({ type: 'CLOSE_SUPPRESS_NAMES_MODAL' }),
        })
      : ''
    }
  `;

  render(template, container);

  requestAnimationFrame(() => {
    if (state.isCreatingProject) {
      const projectInput = container.querySelector('[data-project-autofocus]');
      if (projectInput) projectInput.focus();
    }
  });

  // Call showModal() on the dialog when it's visible
  requestAnimationFrame(() => {
    if (state.showSuppressNamesModal) {
      const dialog = container.querySelector('.suppress-modal');
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    }
  });

  function handleSave(name) {
    dispatch({ type: 'CREATE_PROJECT', payload: { name } });
  }
}
