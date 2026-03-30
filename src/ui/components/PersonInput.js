import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler } from '../../utils/inputHandlers.js';
import { makeDatalistId } from '../../utils/domUtils.js';

export function PersonInput({ onSave, onCancel, nameOptions = [], roleOptions = [] }) {
  let nameValue = '';
  let roleValue = '';

  function handleSave() {
    const name = nameValue.trim();
    const role = roleValue.trim();
    nameValue = '';
    roleValue = '';
    document.querySelectorAll('.person-list-item--creating input').forEach(el => { el.value = ''; });
    onSave(name, role);
  }

  const handleKeyDown = makeKeyDownHandler({
    primaryFieldGetter: () => nameValue,
    fieldValuesGetter: () => [nameValue.trim(), roleValue.trim()],
    onSave: handleSave,
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

  const nameListId = makeDatalistId('person-names-list');
  const roleListId = makeDatalistId('person-roles-list');

  return html`
    <div class="person-list-item person-list-item--creating">
      <input
        ?autofocus=${true}
        data-autofocus
        class="person-input__field person-input__field--name"
        type="text"
        placeholder="Name..."
        .value=${nameValue}
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
        .value=${roleValue}
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
          @click=${handleSave}
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
