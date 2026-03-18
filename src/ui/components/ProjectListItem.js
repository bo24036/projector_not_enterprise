import { html } from '/vendor/lit-html/lit-html.js';

export function ProjectListItem({ project, isSelected, openTaskCount, onSelect }) {
  return html`
    <div class="project-list-item ${isSelected ? 'is-selected' : ''}">
      <button class="project-list-item__button" @click=${onSelect}>
        ${project.name}
        ${openTaskCount > 0 ? html`<span class="sidebar__count">${openTaskCount}</span>` : ''}
      </button>
    </div>
  `;
}
