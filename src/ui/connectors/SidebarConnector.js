import { html, render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectNewItem } from '../components/ProjectNewItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import * as Project from '../../domains/Project.js';
import { dispatch } from '../../state.js';
import { navigateToProject } from '../../utils/router.js';

export function initSidebarConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const allProjects = Project.getAllProjects() || [];
  const activeProjects = allProjects.filter(p => !p.archived);
  const archivedProjects = allProjects.filter(p => p.archived);

  const activeProjectsHtml = activeProjects.map(project =>
    ProjectListItem({
      project,
      isSelected: state.currentProjectId === project.id,
      onSelect: () => navigateToProject(project.id),
    })
  );

  // Add the new project item as the last entry in the active projects list
  const newProjectItem = state.isCreatingProject
    ? ProjectInput({
        onSave: handleSave,
        onCancel: () => dispatch({ type: 'CANCEL_CREATE_PROJECT' }),
      })
    : ProjectNewItem({
        onStartCreate: () => dispatch({ type: 'START_CREATE_PROJECT' }),
      });

  const activeListItems = [...activeProjectsHtml, newProjectItem];

  // Render archived projects only if toggle is enabled
  const archivedSection = state.showArchivedProjects && archivedProjects.length > 0
    ? html`
      <div class="sidebar__archived-section">
        <div class="sidebar__archived-list">
          ${archivedProjects.map(project =>
            ProjectListItem({
              project,
              isSelected: state.currentProjectId === project.id,
              onSelect: () => navigateToProject(project.id),
              onUnarchive: () => dispatch({ type: 'UNARCHIVE_PROJECT', payload: { projectId: project.id } }),
            })
          )}
        </div>
      </div>
    `
    : html``;

  const template = html`
    <div class="sidebar">
      <div class="sidebar__header">
        <h1 class="sidebar__title">Projects</h1>
      </div>

      <div class="sidebar__list">
        ${activeListItems}
      </div>

      <button class="sidebar__archived-toggle" @click=${() => dispatch({ type: 'TOGGLE_ARCHIVED_PROJECTS' })}>
        ≡ Archived
      </button>

      ${archivedSection}
    </div>
  `;

  render(template, container);

  function handleSave(name) {
    dispatch({ type: 'CREATE_PROJECT', payload: { name } });
  }
}
