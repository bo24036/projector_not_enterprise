import { html, ref } from 'https://unpkg.com/lit-html@2/lit-html.js';

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

  function handleBlur() {
    if (!inputValue.trim()) {
      // Defer the cancel to avoid DOM removal during blur event handling
      setTimeout(onCancel, 0);
    }
  }

  return html`
    <div class="project-list-item project-list-item--editing">
      <input
        ${ref(el => el?.focus())}
        class="project-input__field"
        type="text"
        placeholder="New project name..."
        @keydown=${handleKeyDown}
        @input=${handleInput}
        @blur=${handleBlur}
      />
      <div class="project-input__controls">
        <button class="project-input__ok" @click=${() => onSave(inputValue.trim())} title="Save">
          ✓
        </button>
        <button class="project-input__cancel" @click=${onCancel} title="Cancel">
          ✕
        </button>
      </div>
    </div>
  `;
}
