import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function ProjectListItem({ project, isSelected, onSelect, onUnarchive }) {
  function handleUnarchive(event) {
    event.stopPropagation();
    onUnarchive();
  }

  return html`
    <div class="project-list-item ${isSelected ? 'is-selected' : ''}">
      <button class="project-list-item__button" @click=${onSelect}>
        ${project.name}
      </button>
      ${onUnarchive ? html`
        <button class="project-list-item__unarchive-button" @click=${handleUnarchive}>
          Unarchive
        </button>
      ` : html``}
    </div>
  `;
}
