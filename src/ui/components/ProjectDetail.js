import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function ProjectDetail({ project, onNameChange, onDescriptionChange, onDelete }) {
  function handleNameChange(event) {
    onNameChange(event.target.value);
  }

  function handleDescriptionChange(event) {
    onDescriptionChange(event.target.value);
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete();
    }
  }

  return html`
    <div class="project-detail">
      <div class="project-detail__header">
        <input
          class="project-detail__name"
          type="text"
          value=${project.name}
          @change=${handleNameChange}
        />
      </div>

      <div class="project-detail__controls">
        <button class="project-detail__delete-button" @click=${handleDelete}>
          Delete
        </button>
      </div>

      <div class="project-detail__description-section">
        <label class="project-detail__label">Description</label>
        <textarea
          class="project-detail__description"
          placeholder="Enter project description..."
          @change=${handleDescriptionChange}
        >${project.description}</textarea>
      </div>
    </div>
  `;
}
