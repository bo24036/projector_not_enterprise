import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function PersonListItem({ person, isEditing, editName, editRole, onEdit, onDelete, onSave, onCancel, nameOptions = [], roleOptions = [] }) {
  if (isEditing) {
    let nameValue = editName;
    let roleValue = editRole;

    function handleKeyDown(event) {
      if (event.key === 'Enter') {
        onSave(nameValue.trim(), roleValue.trim());
      } else if (event.key === 'Escape') {
        onCancel();
      }
    }

    function handleNameInput(event) {
      nameValue = event.target.value;
    }

    function handleRoleInput(event) {
      roleValue = event.target.value;
    }

    function handleBlur(event) {
      // If focus is moving to another element within this person item, don't cancel
      if (event.relatedTarget) {
        const personItem = event.currentTarget.closest('.person-list-item');
        if (personItem && personItem.contains(event.relatedTarget)) {
          return;
        }
      }
      // Only cancel if user truly left the form
      if (!nameValue.trim()) {
        onCancel();
      }
    }

    const nameListId = `person-names-list-edit-${Math.random().toString(36).substr(2, 9)}`;
    const roleListId = `person-roles-list-edit-${Math.random().toString(36).substr(2, 9)}`;

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
            class="person-input__ok"
            @click=${() => onSave(nameValue.trim(), roleValue.trim())}
            title="Save"
          >
            ✓
          </button>
          <button class="person-input__cancel" @click=${onCancel} title="Cancel">
            ✕
          </button>
        </div>
      </div>
    `;
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${person.name}"?`)) {
      onDelete();
    }
  }

  return html`
    <div class="person-list-item">
      <div class="person-list-item__content">
        <span class="person-list-item__name">${person.name}</span>
        ${person.role ? html`<span class="person-list-item__role">${person.role}</span>` : ''}
      </div>
      <div class="person-list-item__actions">
        <button class="person-list-item__edit" @click=${onEdit} title="Edit">
          ✎
        </button>
        <button class="person-list-item__delete" @click=${handleDelete} title="Delete">
          ×
        </button>
      </div>
    </div>
  `;
}
