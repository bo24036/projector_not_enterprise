import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function ProjectDetail({ project, onNameChange, onDescriptionChange, onArchive, onDelete }) {
  if (!project) return html``;

  function handleNameChange(event) {
    onNameChange(event.target.value);
  }

  function handleDescriptionChange(event) {
    onDescriptionChange(event.target.value);
  }

  function handleArchive() {
    onArchive();
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete();
    }
  }

  return html`
    <div class="project-detail">
      <div class="project-detail__header">
        <div class="project-detail__name-wrapper">
          <input
            class="project-detail__name"
            type="text"
            aria-label="Project name"
            value=${project.name}
            @change=${handleNameChange}
          />
          <span class="project-detail__edit-icon" aria-hidden="true">✎</span>
        </div>
        <div class="project-detail__button-group">
          <button class="project-detail__archive-button" @click=${handleArchive}>
            Archive
          </button>
          <button class="project-detail__delete-button" @click=${handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div class="project-detail__description-section">
        <label class="project-detail__label">Description</label>
        <textarea
          class="project-detail__description"
          placeholder="Enter project description..."
          @change=${handleDescriptionChange}
          .value=${project.description}
        ></textarea>
      </div>
    </div>
  `;
}
