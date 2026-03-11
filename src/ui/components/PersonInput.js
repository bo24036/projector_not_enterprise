import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function PersonInput({ onSave, onCancel, nameOptions = [], roleOptions = [] }) {
  let nameValue = '';
  let roleValue = '';

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (nameValue.trim()) {
        onSave(nameValue.trim(), roleValue.trim());
      }
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

  const nameListId = `person-names-list-${Math.random().toString(36).substr(2, 9)}`;
  const roleListId = `person-roles-list-${Math.random().toString(36).substr(2, 9)}`;

  return html`
    <div class="person-list-item person-list-item--creating">
      <input
        ?autofocus=${true}
        data-person-autofocus
        class="person-input__field person-input__field--name"
        type="text"
        placeholder="Name..."
        list=${nameListId}
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
