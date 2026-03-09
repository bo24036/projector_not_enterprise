import { html, render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import * as Project from '../../domains/Project.js';
import { getState, dispatch, watch } from '../../state.js';
import { navigateToProject } from '../../utils/router.js';

export function initSidebarConnector(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let unsubscribeState = null;
  let unsubscribeCreating = null;

  function renderSidebar() {
    const state = getState();
    const projects = Project.getAllProjects();

    const projectsHtml = projects.map(project =>
      ProjectListItem({
        project,
        isSelected: state.currentProjectId === project.id,
        onSelect: () => navigateToProject(project.id),
      })
    );

    const template = html`
      <div class="sidebar">
        <div class="sidebar__header">
          <h1 class="sidebar__title">Projects</h1>
        </div>

        <div class="sidebar__list">
          ${projectsHtml.length > 0
            ? projectsHtml
            : html`<p class="sidebar__empty">No projects yet</p>`}
        </div>

        <div class="sidebar__new-project">
          ${state.isCreatingProject
            ? ProjectInput({
                onSave: handleSave,
                onCancel: () => dispatch({ type: 'CANCEL_CREATE_PROJECT' }),
              })
            : html`
                <button
                  class="sidebar__new-button"
                  @click=${() => dispatch({ type: 'START_CREATE_PROJECT' })}
                >
                  + New Project
                </button>
              `}
        </div>
      </div>
    `;

    render(template, container);
  }

  function handleSave(name) {
    const projects = Project.getAllProjects();
    if (projects.some(p => p.name === name)) {
      alert('A project with this name already exists.');
      return;
    }

    dispatch({ type: 'CREATE_PROJECT', payload: { name } });
  }

  unsubscribeState = watch('currentProjectId', renderSidebar);
  unsubscribeCreating = watch('isCreatingProject', renderSidebar);

  renderSidebar();

  return {
    destroy: () => {
      if (unsubscribeState) unsubscribeState();
      if (unsubscribeCreating) unsubscribeCreating();
    },
  };
}
