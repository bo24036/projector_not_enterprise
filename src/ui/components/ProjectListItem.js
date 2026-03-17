import { html } from '/vendor/lit-html/lit-html.js';

export function ProjectListItem({ project, isSelected, onSelect }) {
  return html`
    <div class="project-list-item ${isSelected ? 'is-selected' : ''}">
      <button class="project-list-item__button" @click=${onSelect}>
        ${project.name}
      </button>
    </div>
  `;
}
