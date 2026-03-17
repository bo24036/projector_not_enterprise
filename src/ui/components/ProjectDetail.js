import { html } from '/vendor/lit-html/lit-html.js';

export function ProjectDetail({ project, onNameChange, onDescriptionChange, onArchive, onUnarchive, onToggleFunded, onDelete }) {
  if (!project) return html``;

  const isArchived = project.archived;

  function handleNameChange(event) {
    onNameChange(event.target.value);
  }

  function handleDescriptionChange(event) {
    onDescriptionChange(event.target.value);
  }

  function handleArchive() {
    onArchive();
  }

  function handleUnarchive() {
    onUnarchive();
  }

  function handleToggleFunded() {
    onToggleFunded();
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete();
    }
  }

  return html`
    <div class="project-detail">
      <div class="project-detail__header">
        <div class="project-detail__header-left">
          <div class="project-detail__name-wrapper">
            <input
              class="project-detail__name"
              type="text"
              aria-label="Project name"
              value=${project.name}
              ?disabled=${isArchived}
              @change=${handleNameChange}
            />
            <input
              class="project-detail__funded-checkbox"
              type="checkbox"
              aria-label="Mark project as funded"
              ?checked=${project.funded}
              ?disabled=${isArchived}
              @change=${handleToggleFunded}
            />
            <span class="project-detail__funded-label" aria-hidden="true">$</span>
          </div>
          <div class="project-detail__description-inline">
            <label class="project-detail__label">Description</label>
            <textarea
              class="project-detail__description"
              placeholder="Enter project description..."
              ?disabled=${isArchived}
              @change=${handleDescriptionChange}
              .value=${project.description}
            ></textarea>
          </div>
        </div>
        <div class="project-detail__header-right">
          <div class="project-detail__button-group">
            ${isArchived
              ? html`
                <button class="project-detail__unarchive-button" @click=${handleUnarchive}>
                  Unarchive
                </button>
              `
              : html`
                <button class="project-detail__archive-button" @click=${handleArchive}>
                  Archive
                </button>
              `
            }
            <button class="project-detail__delete-button" @click=${handleDelete}>
              Delete
            </button>
          </div>
          <div class="project-detail__metadata">
            <div class="project-detail__metadata-item">
              <span class="project-detail__metadata-label">Created:</span>
              <span class="project-detail__metadata-value">${formatISODate(project.createdAt)}</span>
            </div>
            ${project.archivedAt
              ? html`
                <div class="project-detail__metadata-item">
                  <span class="project-detail__metadata-label">Archived:</span>
                  <span class="project-detail__metadata-value">${formatISODate(project.archivedAt)}</span>
                </div>
              `
              : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatISODate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
