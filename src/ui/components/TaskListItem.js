import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { formatDueDate, getUrgency } from '../../domains/Task.js';

export function TaskListItem({ task, isArchived, isEditing, editName, editDueDate, onToggle, onEdit, onDelete, onSave, onCancel }) {
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
      <div class="task-list-item task-list-item--editing">
        <input
          ?autofocus=${true}
          data-task-autofocus
          class="task-input__field task-input__field--name"
          type="text"
          placeholder="Task name..."
          .value=${nameValue}
          @input=${handleNameInput}
          @keydown=${handleKeyDown}
          @blur=${handleBlur}
        />
        <input
          class="task-input__field task-input__field--due-date"
          type="text"
          placeholder="Due date..."
          .value=${dueDateValue}
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

  const dueDateFormatted = formatDueDate(task.dueDate);
  const urgency = getUrgency(task.dueDate);

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      onDelete();
    }
  }

  return html`
    <div class="task-list-item ${task.completed ? 'is-completed' : ''} urgency-${urgency}">
      <div class="task-list-item__content">
        <input
          type="checkbox"
          class="task-list-item__checkbox"
          ?checked=${task.completed}
          ?disabled=${isArchived}
          @change=${() => onToggle()}
          title="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
        />
        <span class="task-list-item__name">${task.name}</span>
        ${dueDateFormatted
          ? html`<span class="task-list-item__due-date">${dueDateFormatted}</span>`
          : ''}
      </div>
      ${!isArchived ? html`
        <div class="task-list-item__actions">
          <button class="task-list-item__edit" @click=${onEdit} title="Edit">
            ✎
          </button>
          <button class="task-list-item__delete" @click=${handleDelete} title="Delete">
            ×
          </button>
        </div>
      ` : ''}
    </div>
  `;
}
