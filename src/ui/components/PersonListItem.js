import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler, makeDeleteHandler } from '../../utils/inputHandlers.js';
import { makeDatalistId } from '../../utils/domUtils.js';

export function PersonListItem({ person, isArchived, isEditing, editName, editRole, onEdit, onDelete, onSave, onCancel, nameOptions = [], roleOptions = [] }) {
  if (isEditing) {
    let nameValue = editName;
    let roleValue = editRole;

    const handleKeyDown = makeKeyDownHandler({
      primaryFieldGetter: () => nameValue,
      fieldValuesGetter: () => [nameValue.trim(), roleValue.trim()],
      onSave,
      onCancel,
    });

    const handleBlur = makeBlurHandler({
      primaryFieldGetter: () => nameValue,
      onCancel,
      itemSelector: '.person-list-item',
    });

    function handleNameInput(event) {
      nameValue = event.target.value;
    }

    function handleRoleInput(event) {
      roleValue = event.target.value;
    }

    const nameListId = makeDatalistId('person-names-list-edit');
    const roleListId = makeDatalistId('person-roles-list-edit');

    return html`
      <div class="person-list-item person-list-item--editing">
        <input
          ?autofocus=${true}
          data-person-autofocus
          class="person-input__field person-input__field--name"
          type="text"
          placeholder="Name..."
          list=${nameListId}
          .value=${nameValue}
          @input=${handleNameInput}
          @keydown=${handleKeyDown}
          @blur=${handleBlur}
        />
        <datalist id=${nameListId}>
          ${nameOptions.map(name => html`<option value=${name}></option>`)}
        </datalist>
        <input
          class="person-input__field person-input__field--role"
          type="text"
          placeholder="Role..."
          list=${roleListId}
          .value=${roleValue}
          @input=${handleRoleInput}
          @keydown=${handleKeyDown}
          @blur=${handleBlur}
        />
        <datalist id=${roleListId}>
          ${roleOptions.map(role => html`<option value=${role}></option>`)}
        </datalist>
        <div class="person-input__controls">
          <button
            class="button-ok"
            @click=${() => onSave(nameValue.trim(), roleValue.trim())}
            title="Save"
          >
            ✓
          </button>
          <button class="button-cancel" @click=${onCancel} title="Cancel">
            ✕
          </button>
        </div>
      </div>
    `;
  }

  const handleDelete = makeDeleteHandler({
    entityName: person.name,
    onDelete,
  });

  return html`
    <div class="person-list-item">
      <div class="person-list-item__content">
        <span class="person-list-item__name">${person.name}</span>
        ${person.role ? html`<span class="person-list-item__role">${person.role}</span>` : ''}
      </div>
      ${!isArchived ? html`
        <div class="person-list-item__actions">
          <button class="person-list-item__edit" @click=${onEdit} title="Edit">
            ✎
          </button>
          <button class="person-list-item__delete" @click=${handleDelete} title="Delete">
            ×
          </button>
        </div>
      ` : ''}
    </div>
  `;
}
