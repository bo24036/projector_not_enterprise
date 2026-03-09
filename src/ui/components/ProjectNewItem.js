import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';

export function ProjectNewItem({ onStartCreate }) {
  return html`
    <div class="project-list-item">
      <button class="project-list-item__button project-list-item__button--new" @click=${onStartCreate}>
        + New project
      </button>
    </div>
  `;
}
