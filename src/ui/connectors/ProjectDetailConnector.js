import { html, render } from '/vendor/lit-html/lit-html.js';
import { focusAutofocusElement } from '../../utils/domHelpers.js';
import { ProjectDetail } from '../components/ProjectDetail.js';
import { RestoreProjectModal } from '../components/RestoreProjectModal.js';
import { TaskListConnector } from './TaskListConnector.js';
import { PersonInput } from '../components/PersonInput.js';
import { PersonListItem } from '../components/PersonListItem.js';
import { NoteListConnector } from './NoteListConnector.js';
import * as Project from '../../domains/Project.js';
import * as Person from '../../domains/Person.js';
import * as Settings from '../../domains/Settings.js';
import { dispatch } from '../../state.js';
import { navigateToOverview } from '../../utils/router.js';

let lastTaskFormKey = null;
let lastPersonFormKey = null;

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

  const isHeld = project.heldAt !== null;
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const createdAtFormatted = formatDate(project.createdAt);
  const archivedAtFormatted = formatDate(project.archivedAt);
  const holdReviewDays = Settings.getHoldReviewDays();
  const isReviewDue = isHeld && (Date.now() - project.heldAt > holdReviewDays * 86400000);

  const people = Person.getPeopleByProjectId(project.id) || [];
  const { names: allNames, roles: allRoles } = Person.getAllPeopleForAutocomplete();
  const { creatingPerson, editingPersonId } = state;
  const editingPerson = editingPersonId ? Person.getPerson(editingPersonId) : null;

  const template = html`
    <div class="project-detail-container">
      ${ProjectDetail({
        project,
        isReviewDue,
        createdAtFormatted,
        archivedAtFormatted,
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
        onHold: () => {
          dispatch({ type: 'HOLD_PROJECT', payload: { projectId: project.id } });
        },
        onRestore: () => {
          dispatch({ type: 'SHOW_RESTORE_MODAL', payload: { projectId: project.id } });
        },
      })}

      ${state.restoringProjectId === project.id ? RestoreProjectModal({
        onKeep: () => dispatch({ type: 'RESTORE_PROJECT', payload: { projectId: project.id, clearDueDates: false } }),
        onClear: () => dispatch({ type: 'RESTORE_PROJECT', payload: { projectId: project.id, clearDueDates: true } }),
        onClose: () => dispatch({ type: 'SHOW_RESTORE_MODAL', payload: { projectId: null } }),
      }) : ''}

      <div class="project-detail__tasks-section">
        <h3 class="project-detail__section-title">Tasks</h3>
        ${TaskListConnector({ projectId: project.id, state })}
      </div>

      <div class="project-detail__people-section">
        <h3 class="project-detail__section-title">People</h3>
        <div class="project-detail__people">
          ${people.map(person => PersonListItem({
            person,
            isArchived: project.archived,
            isEditing: editingPersonId === person.id,
            editName: editingPerson?.name ?? '',
            editRole: editingPerson?.role ?? '',
            nameOptions: allNames,
            roleOptions: allRoles,
            onEdit: () => dispatch({ type: 'START_EDIT_PERSON', payload: { personId: person.id } }),
            onDelete: () => dispatch({ type: 'DELETE_PERSON', payload: { personId: person.id } }),
            onSave: (name, role) => dispatch({ type: 'UPDATE_PERSON', payload: { personId: person.id, name, role } }),
            onCancel: () => dispatch({ type: 'CANCEL_EDIT_PERSON' }),
          }))}
          ${!project.archived ? (!creatingPerson
            ? html`<div class="person-list-item person-list-item--placeholder">
                <button class="person-list-item__placeholder-button"
                  @click=${() => dispatch({ type: 'START_CREATE_PERSON' })}>
                  [Click to add person...]
                </button>
              </div>`
            : PersonInput({
                nameOptions: allNames,
                roleOptions: allRoles,
                onSave: (name, role) => {
                  dispatch({ type: 'CREATE_PERSON', payload: { projectId: project.id, name, role } });
                },
                onCancel: () => dispatch({ type: 'CANCEL_CREATE_PERSON' }),
              })
          ) : ''}
        </div>
      </div>

      <div class="project-detail__notes-section">
        <h3 class="project-detail__section-title">Notes</h3>
        ${NoteListConnector({ projectId: project.id, state })}
      </div>
    </div>
  `;

  render(template, container);

  requestAnimationFrame(() => {
    if (state.restoringProjectId === project.id) {
      const dialog = container.querySelector('.restore-modal');
      if (dialog && !dialog.open) dialog.showModal();
    }

    // When an item is saved and the form stays open, *FormKey increments.
    // Clear all inputs and force-focus the primary field for the fresh form.
    if (state.creatingTask && state.taskFormKey !== lastTaskFormKey) {
      lastTaskFormKey = state.taskFormKey;
      container.querySelectorAll('.task-list-item--creating input').forEach(el => { el.value = ''; });
      container.querySelector('.task-input__field--name')?.focus();
    }
    if (state.creatingPerson && state.personFormKey !== lastPersonFormKey) {
      lastPersonFormKey = state.personFormKey;
      container.querySelectorAll('.person-list-item--creating input').forEach(el => { el.value = ''; });
      container.querySelector('.person-input__field--name')?.focus();
    }
  });

  focusAutofocusElement(container);
}
