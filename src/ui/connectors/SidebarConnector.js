import { html, render } from '/vendor/lit-html/lit-html.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectNewItem } from '../components/ProjectNewItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import { SuppressNamesModal } from '../components/SuppressNamesModal.js';
import * as Project from '../../domains/Project.js';
import * as Person from '../../domains/Person.js';
import { dispatch } from '../../state.js';
import { navigateToProject, navigateToOverview, navigateToPersonal } from '../../utils/router.js';

export function initSidebarConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const allProjects = Project.getAllProjects() || [];
  const activeProjects = allProjects.filter(p => !p.archived);
  const archivedProjects = allProjects.filter(p => p.archived);

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

      <button class="sidebar__overview-btn ${state.currentPage === 'overview' ? 'is-active' : ''}" @click=${navigateToOverview}>
        Overview
      </button>

      <button class="sidebar__personal-btn ${state.currentPage === 'personal' ? 'is-active' : ''}" @click=${navigateToPersonal}>
        My Tasks
      </button>

      <div class="sidebar__list">
        ${activeProjects.map(project =>
          ProjectListItem({
            project,
            isSelected: state.currentProjectId === project.id,
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
          Manage Suppressed Names
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
