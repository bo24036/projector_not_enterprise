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

  function handleBlur(event) {
    // If focus is moving to another element within this task item, don't cancel
    if (event.relatedTarget) {
      const taskItem = event.currentTarget.closest('.task-list-item');
      if (taskItem && taskItem.contains(event.relatedTarget)) {
        return;
      }
    }
    // Only cancel if user truly left the task form
    if (!nameValue.trim()) {
      onCancel();
    }
  }

  return html`
    <div class="task-list-item task-list-item--creating">
      <input
        ?autofocus=${true}
        data-task-autofocus
        class="task-input__field task-input__field--name"
        type="text"
        placeholder="[Click to add task...]"
        @input=${handleNameInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <input
        class="task-input__field task-input__field--due-date"
        type="text"
        placeholder="Due date..."
        @input=${handleDueDateInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <div class="task-input__controls">
        <button
          class="task-input__ok"
          @click=${() => onSave(nameValue.trim(), dueDateValue.trim())}
          title="Save"
        >
          ✓
        </button>
        <button class="task-input__cancel" @click=${onCancel} title="Cancel">
          ✕
        </button>
      </div>
    </div>
  `;
}
