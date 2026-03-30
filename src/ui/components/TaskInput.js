import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler } from '../../utils/inputHandlers.js';

export function TaskInput({ onSave, onCancel, nameValue: initialName = '', dueDateValue: initialDueDate = '' }) {
  let nameValue = initialName;
  let dueDateValue = initialDueDate;

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
    <div class="task-list-item task-list-item--creating">
      <input
        ?autofocus=${true}
        data-autofocus
        class="task-input__field task-input__field--name"
        type="text"
        placeholder="[Click to add task...]"
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
