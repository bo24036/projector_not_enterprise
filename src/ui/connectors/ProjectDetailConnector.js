import { html, render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { ProjectDetail } from '../components/ProjectDetail.js';
import * as Project from '../../domains/Project.js';
import { getState, dispatch, watch } from '../../state.js';
import { navigateToList } from '../../utils/router.js';

export function initProjectDetailConnector(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let unsubscribeState = null;

  function renderDetail() {
    const state = getState();
    const project = state.currentProjectId ? Project.getProject(state.currentProjectId) : null;

    if (!project) {
      const template = html`
        <div class="project-detail-empty">
          <p>Select a project from the sidebar to view its details.</p>
        </div>
      `;
      render(template, container);
      return;
    }

    const template = html`
      <div class="project-detail-container">
        ${ProjectDetail({
          project,
          onNameChange: (newName) => {
            if (newName.trim() && newName !== project.name) {
              dispatch({ type: 'RENAME_PROJECT', payload: { projectId: project.id, newName } });
            }
          },
          onDescriptionChange: (description) => {
            dispatch({
              type: 'UPDATE_DESCRIPTION',
              payload: { projectId: project.id, description },
            });
          },
          onDelete: () => {
            dispatch({ type: 'DELETE_PROJECT', payload: { projectId: project.id } });
            navigateToList();
          },
        })}
      </div>
    `;

    render(template, container);
  }

  unsubscribeState = watch('currentProjectId', renderDetail);

  renderDetail();

  return {
    destroy: () => {
      if (unsubscribeState) unsubscribeState();
    },
  };
}
