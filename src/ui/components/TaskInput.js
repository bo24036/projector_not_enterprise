import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function TaskInput({ onSave, onCancel }) {
  let nameValue = '';
  let dueDateValue = '';

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (nameValue.trim()) {
        onSave(nameValue.trim(), dueDateValue.trim());
      }
    } else if (event.key === 'Escape') {
      onCancel();
    }
  }

  function handleNameInput(event) {
    nameValue = event.target.value;
  }

  function handleDueDateInput(event) {
    dueDateValue = event.target.value;
  }

  function handleNameBlur() {
    if (!nameValue.trim()) {
      onCancel();
    }
  }

  return html`
    <div class="task-list-item task-list-item--creating">
      <div class="task-list-item__create-form">
        <input
          autofocus
          class="task-list-item__field task-list-item__field--name"
          type="text"
          placeholder="[Click to add task...]"
          @input=${handleNameInput}
          @keydown=${handleKeyDown}
          @blur=${handleNameBlur}
        />
        <input
          class="task-list-item__field task-list-item__field--due-date"
          type="text"
          placeholder="Due date (+5, tomorrow, 2025-02-25)..."
          @input=${handleDueDateInput}
          @keydown=${handleKeyDown}
        />
        <div class="task-list-item__controls">
          <button
            class="task-list-item__ok"
            @click=${() => onSave(nameValue.trim(), dueDateValue.trim())}
            title="Save"
          >
            ✓
          </button>
          <button class="task-list-item__cancel" @click=${onCancel} title="Cancel">
            ✕
          </button>
        </div>
      </div>
    </div>
  `;
}
