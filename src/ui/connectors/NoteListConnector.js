import { html } from '/vendor/lit-html/lit-html.js';
import { NoteListItem } from '../components/NoteListItem.js';
import { NoteInput } from '../components/NoteInput.js';
import * as Note from '../../domains/Note.js';
import * as Project from '../../domains/Project.js';
import { dispatch } from '../../state.js';

export function NoteListConnector({ projectId, state }) {
  const notes = Note.getNotesByProjectId(projectId);
  const project = Project.getProject(projectId);
  const isArchived = project?.archived ?? false;
  const { creatingNote, editingNoteId } = state;
  const editingNote = editingNoteId ? Note.getNote(editingNoteId) : null;

  return html`
    <div class="note-list">
      ${notes.map(note => {
        const parsedLink = Note.parseLinkField(note.link);
        return NoteListItem({
        note,
        isArchived,
        isEditing: editingNoteId === note.id,
        editContent: editingNote?.content ?? '',
        editLink: editingNote?.link ?? '',
        linkUrl: parsedLink?.url ?? null,
        linkLabel: parsedLink?.label ?? null,
        onEdit: () => dispatch({ type: 'START_EDIT_NOTE', payload: { noteId: note.id } }),
        onDelete: () => dispatch({ type: 'DELETE_NOTE', payload: { noteId: note.id } }),
        onSave: (content, link) => dispatch({ type: 'UPDATE_NOTE', payload: { noteId: note.id, content, link } }),
        onCancel: () => dispatch({ type: 'CANCEL_EDIT_NOTE' }),
      });
      })}

      ${!isArchived ? (creatingNote ? NoteInput({
        onSave: (content, link) => dispatch({ type: 'CREATE_NOTE', payload: { projectId, content, link } }),
        onCancel: () => dispatch({ type: 'CANCEL_CREATE_NOTE' }),
      }) : html`
        <div class="note-list-item note-list-item--placeholder">
          <button
            class="note-list-item__placeholder-button"
            @click=${() => dispatch({ type: 'START_CREATE_NOTE' })}
          >
            [Click to add note...]
          </button>
        </div>
      `) : ''}
    </div>
  `;
}
