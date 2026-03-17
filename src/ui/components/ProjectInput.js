import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler } from '../../utils/inputHandlers.js';

export function ProjectInput({ onSave, onCancel }) {
  let inputValue = '';

  const handleKeyDown = makeKeyDownHandler({
    primaryFieldGetter: () => inputValue,
    fieldValuesGetter: () => [inputValue.trim()],
    onSave,
    onCancel,
  });

  const handleBlur = makeBlurHandler({
    primaryFieldGetter: () => inputValue,
    onCancel,
  });

  function handleInput(event) {
    inputValue = event.target.value;
  }

  return html`
    <div class="project-list-item project-list-item--editing">
      <input
        autofocus
        class="project-input__field"
        type="text"
        placeholder="New project name..."
        @keydown=${handleKeyDown}
        @input=${handleInput}
        @blur=${handleBlur}
      />
      <div class="project-input__controls">
        <button class="button-ok" @click=${() => onSave(inputValue.trim())} title="Save">
          ✓
        </button>
        <button class="button-cancel" @click=${onCancel} title="Cancel">
          ✕
        </button>
      </div>
    </div>
  `;
}
