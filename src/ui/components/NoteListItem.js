import { html } from '/vendor/lit-html/lit-html.js';
import { makeKeyDownHandler, makeBlurHandler, makeDeleteHandler } from '../../utils/inputHandlers.js';

export function NoteListItem({ note, isEditing, editContent, editLink, isArchived, linkUrl, linkLabel, onEdit, onDelete, onSave, onCancel }) {
  if (isEditing) {
    let contentValue = editContent;
    let linkValue = editLink;

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
      <div class="note-list-item note-list-item--editing">
        <input
          data-note-autofocus
          class="note-input__field note-input__field--content"
          type="text"
          placeholder="Note content..."
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

  const handleDelete = makeDeleteHandler({
    entityName: note.content.slice(0, 40),
    onDelete,
  });

  return html`
    <div class="note-list-item">
      <div class="note-list-item__content">
        <span class="note-list-item__text">${note.content}</span>
        ${linkUrl
          ? html`<a class="note-list-item__link" href=${linkUrl} target="_blank" rel="noopener noreferrer">${linkLabel ?? linkUrl}</a>`
          : ''}
      </div>
      ${!isArchived ? html`
        <div class="note-list-item__actions">
          <button class="note-list-item__edit" @click=${onEdit} title="Edit">
            ✎
          </button>
          <button class="note-list-item__delete" @click=${handleDelete} title="Delete">
            ×
          </button>
        </div>
      ` : ''}
    </div>
  `;
}
