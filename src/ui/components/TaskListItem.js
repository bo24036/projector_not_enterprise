import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { formatDueDate, getUrgency } from '../../domains/Task.js';

export function TaskListItem({ task, isEditing, editName, editDueDate, onToggle, onEdit, onDelete, onSave, onCancel }) {
  if (isEditing) {
    let nameValue = editName;
    let dueDateValue = editDueDate;

    function handleKeyDown(event) {
      if (event.key === 'Enter') {
        onSave(nameValue.trim(), dueDateValue.trim());
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

    return html`
      <div class="task-list-item task-list-item--editing">
        <div class="task-list-item__edit-form">
          <input
            autofocus
            class="task-list-item__field task-list-item__field--name"
            type="text"
            placeholder="Task name..."
            .value=${nameValue}
            @input=${handleNameInput}
            @keydown=${handleKeyDown}
          />
          <input
            class="task-list-item__field task-list-item__field--due-date"
            type="text"
            placeholder="Due date (+5, tomorrow, 2025-02-25)..."
            .value=${dueDateValue}
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

  const dueDateFormatted = formatDueDate(task.dueDate);
  const urgency = getUrgency(task.dueDate);

  return html`
    <div class="task-list-item ${task.completed ? 'is-completed' : ''} urgency-${urgency}">
      <div class="task-list-item__content">
        <input
          type="checkbox"
          class="task-list-item__checkbox"
          ?checked=${task.completed}
          @change=${() => onToggle()}
          title="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
        />
        <span class="task-list-item__name">${task.name}</span>
        ${dueDateFormatted
          ? html`<span class="task-list-item__due-date">${dueDateFormatted}</span>`
          : ''}
      </div>
      <div class="task-list-item__actions">
        <button class="task-list-item__edit" @click=${onEdit} title="Edit">
          ✎
        </button>
        <button class="task-list-item__delete" @click=${onDelete} title="Delete">
          ×
        </button>
      </div>
    </div>
  `;
}
