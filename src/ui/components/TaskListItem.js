import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler, makeDeleteHandler } from '../../utils/inputHandlers.js';

export function TaskListItem({ task, dueDateFormatted, urgency, isArchived, isEditing, editName, editDueDate, onToggle, onEdit, onDelete, onSave, onCancel }) {
  if (isEditing) {
    let nameValue = editName;
    let dueDateValue = editDueDate;

    const handleKeyDown = makeKeyDownHandler({
      primaryFieldGetter: () => nameValue,
      fieldValuesGetter: () => [nameValue.trim(), dueDateValue.trim()],
      onSave,
      onCancel,
    });

    const handleBlur = makeBlurHandler({
      primaryFieldGetter: () => nameValue,
      onCancel,
      itemSelector: '.task-list-item',
    });

    function handleNameInput(event) {
      nameValue = event.target.value;
    }

    function handleDueDateInput(event) {
      dueDateValue = event.target.value;
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
            class="button-ok"
            @click=${() => onSave(nameValue.trim(), dueDateValue.trim())}
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
    entityName: task.name,
    onDelete,
  });

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
