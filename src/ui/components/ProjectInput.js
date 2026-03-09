import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function ProjectInput({ onSave, onCancel }) {
  let inputValue = '';

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (inputValue.trim()) {
        onSave(inputValue.trim());
      }
    } else if (event.key === 'Escape') {
      onCancel();
    }
  }

  function handleInput(event) {
    inputValue = event.target.value;
  }

  return html`
    <div class="project-input">
      <input
        class="project-input__field"
        type="text"
        placeholder="New project name..."
        @keydown=${handleKeyDown}
        @input=${handleInput}
        autofocus
      />
      <button class="project-input__save" @click=${() => onSave(inputValue.trim())}>
        Save
      </button>
      <button class="project-input__cancel" @click=${onCancel}>
        Cancel
      </button>
    </div>
  `;
}
