import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler } from '../../utils/inputHandlers.js';

export function NoteInput({ onSave, onCancel }) {
  let contentValue = '';
  let linkValue = '';

  const handleKeyDown = makeKeyDownHandler({
    primaryFieldGetter: () => contentValue,
    fieldValuesGetter: () => [contentValue.trim(), linkValue.trim()],
    onSave,
    onCancel,
  });

  const handleBlur = makeBlurHandler({
    primaryFieldGetter: () => contentValue,
    onCancel,
    itemSelector: '.note-list-item',
  });

  function handleContentInput(event) {
    contentValue = event.target.value;
  }

  function handleLinkInput(event) {
    linkValue = event.target.value;
  }

  return html`
    <div class="note-list-item note-list-item--creating">
      <input
        data-note-autofocus
        class="note-input__field note-input__field--content"
        type="text"
        placeholder="[Click to add note...]"
        @input=${handleContentInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <input
        class="note-input__field note-input__field--link"
        type="text"
        placeholder="Link or [label](url)..."
        @input=${handleLinkInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <div class="note-input__controls">
        <button
          class="button-ok"
          @click=${() => onSave(contentValue.trim(), linkValue.trim())}
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
