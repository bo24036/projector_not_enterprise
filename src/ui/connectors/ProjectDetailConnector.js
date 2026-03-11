import { html, render } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { ProjectDetail } from '../components/ProjectDetail.js';
import { TaskListConnector } from './TaskListConnector.js';
import { PersonInput } from '../components/PersonInput.js';
import { PersonListItem } from '../components/PersonListItem.js';
import * as Project from '../../domains/Project.js';
import * as Person from '../../domains/Person.js';
import { dispatch } from '../../state.js';
import { navigateToOverview } from '../../utils/router.js';

export function initProjectDetailConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

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

  const people = Person.getPeopleByProjectId(project.id) || [];
  const { names: allNames, roles: allRoles } = Person.getAllPeopleForAutocomplete();
  const { creatingPerson, editingPersonId, editingPersonName, editingPersonRole } = state;

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
        onArchive: () => {
          dispatch({ type: 'ARCHIVE_PROJECT', payload: { projectId: project.id } });
          navigateToOverview();
        },
        onUnarchive: () => {
          dispatch({ type: 'UNARCHIVE_PROJECT', payload: { projectId: project.id } });
        },
        onToggleFunded: () => {
          dispatch({ type: 'TOGGLE_FUNDED', payload: { projectId: project.id } });
        },
        onDelete: () => {
          dispatch({ type: 'DELETE_PROJECT', payload: { projectId: project.id } });
          navigateToOverview();
        },
      })}

      <div class="project-detail__tasks-section">
        <h3 class="project-detail__section-title">Tasks</h3>
        ${TaskListConnector({ projectId: project.id, state })}
      </div>

      <div class="project-detail__people-section">
        <h3 class="project-detail__section-title">People</h3>
        <div class="project-detail__people">
          ${people.map(person => PersonListItem({
            person,
            isEditing: editingPersonId === person.id,
            editName: editingPersonName,
            editRole: editingPersonRole,
            nameOptions: allNames,
            roleOptions: allRoles,
            onEdit: () => dispatch({ type: 'START_EDIT_PERSON', payload: { personId: person.id } }),
            onDelete: () => dispatch({ type: 'DELETE_PERSON', payload: { personId: person.id } }),
            onSave: (name, role) => dispatch({ type: 'UPDATE_PERSON', payload: { personId: person.id, name, role } }),
            onCancel: () => dispatch({ type: 'CANCEL_EDIT_PERSON' }),
          }))}
          ${!creatingPerson
            ? html`<div class="person-list-item person-list-item--placeholder">
                <button class="person-list-item__placeholder-button"
                  @click=${() => dispatch({ type: 'START_CREATE_PERSON' })}>
                  [Click to add person...]
                </button>
              </div>`
            : PersonInput({
                nameOptions: allNames,
                roleOptions: allRoles,
                onSave: (name, role) => dispatch({ type: 'CREATE_PERSON', payload: { projectId: project.id, name, role } }),
                onCancel: () => dispatch({ type: 'CANCEL_CREATE_PERSON' }),
              })
          }
        </div>
      </div>
    </div>
  `;

  render(template, container);

  // Explicitly focus input when creation form or edit form is shown
  // Use rAF to ensure focus happens after browser has painted the new DOM
  requestAnimationFrame(() => {
    if (state.creatingTask || state.editingTaskId) {
      const taskInput = container.querySelector('[data-task-autofocus]');
      if (taskInput) {
        taskInput.focus();
      }
    }
    if (state.creatingPerson || state.editingPersonId) {
      const personInput = container.querySelector('[data-person-autofocus]');
      if (personInput) {
        personInput.focus();
      }
    }
  });
}
