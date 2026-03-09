import { html, render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectNewItem } from '../components/ProjectNewItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import * as Project from '../../domains/Project.js';
import { dispatch, watch } from '../../state.js';
import { navigateToProject } from '../../utils/router.js';

export function initSidebarConnector(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let currentProjectId = null;
  let isCreatingProject = false;
  let unsubscribeCurrentProjectId = null;
  let unsubscribeIsCreating = null;

  function renderSidebar() {
    const projects = Project.getAllProjects();

    const projectsHtml = projects.map(project =>
      ProjectListItem({
        project,
        isSelected: currentProjectId === project.id,
        onSelect: () => navigateToProject(project.id),
      })
    );

    // Add the new project item as the last entry in the list
    const newProjectItem = isCreatingProject
      ? ProjectInput({
          onSave: handleSave,
          onCancel: () => dispatch({ type: 'CANCEL_CREATE_PROJECT' }),
        })
      : ProjectNewItem({
          onStartCreate: () => dispatch({ type: 'START_CREATE_PROJECT' }),
        });

    const listItems = [...projectsHtml, newProjectItem];

    const template = html`
      <div class="sidebar">
        <div class="sidebar__header">
          <h1 class="sidebar__title">Projects</h1>
        </div>

        <div class="sidebar__list">
          ${listItems}
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

  unsubscribeCurrentProjectId = watch('currentProjectId', (newId) => {
    currentProjectId = newId;
    renderSidebar();
  });

  unsubscribeIsCreating = watch('isCreatingProject', (isCreating) => {
    isCreatingProject = isCreating;
    renderSidebar();
  });

  renderSidebar();

  return {
    destroy: () => {
      if (unsubscribeCurrentProjectId) unsubscribeCurrentProjectId();
      if (unsubscribeIsCreating) unsubscribeIsCreating();
    },
  };
}
