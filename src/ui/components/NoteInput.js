import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler } from '../../utils/inputHandlers.js';

export function NoteInput({ onSave, onCancel }) {
  let contentValue = '';
  let linkValue = '';

  function handleSave() {
    const content = contentValue.trim();
    const link = linkValue.trim();
    contentValue = '';
    linkValue = '';
    document.querySelectorAll('.note-list-item--creating input').forEach(el => { el.value = ''; });
    onSave(content, link);
  }

  const handleKeyDown = makeKeyDownHandler({
    primaryFieldGetter: () => contentValue,
    fieldValuesGetter: () => [contentValue.trim(), linkValue.trim()],
    onSave: handleSave,
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
        data-autofocus
        class="note-input__field note-input__field--content"
        type="text"
        placeholder="[Click to add note...]"
        .value=${contentValue}
        @input=${handleContentInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <input
        class="note-input__field note-input__field--link"
        type="text"
        placeholder="Link or [label](url)..."
        .value=${linkValue}
        @input=${handleLinkInput}
        @keydown=${handleKeyDown}
        @blur=${handleBlur}
      />
      <div class="note-input__controls">
        <button
          class="button-ok"
          @click=${handleSave}
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
