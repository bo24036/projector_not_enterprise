import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { formatDueDate, getUrgency } from '../../domains/Task.js';

export function OverviewPage({ projects }) {
  if (projects.length === 0) {
    return html`
      <div class="overview-page">
        <h1 class="overview-page__title">Overview</h1>
        <div class="overview-empty">
          <p>No projects yet. Create one to get started.</p>
        </div>
      </div>
    `;
  }

  return html`
    <div class="overview-page">
      <h1 class="overview-page__title">Overview</h1>
      ${projects.map(({ project, incompleteTasks, onProjectClick }) => html`
        <div class="overview-project">
          <div class="overview-project__header">
            <h3 class="overview-project__name" @click=${onProjectClick} role="button" tabindex="0">
              ${project.name}
            </h3>
            ${project.funded ? html`<span class="overview-project__badge">Funded</span>` : ''}
          </div>

          ${incompleteTasks.length === 0
            ? html`<div class="overview-project__no-tasks">No incomplete tasks</div>`
            : html`
                <div class="overview-project__tasks">
                  ${incompleteTasks.map(({ task, onToggle }) => {
                    const dueDateFormatted = formatDueDate(task.dueDate);
                    const urgency = getUrgency(task.dueDate);
                    const completedClass = task.completed ? 'is-completed' : '';

                    return html`
                      <div class="overview-task ${completedClass} urgency-${urgency}">
                        <input
                          type="checkbox"
                          class="overview-task__checkbox"
                          ?checked=${task.completed}
                          @change=${onToggle}
                        />
                        <span class="overview-task__name">${task.name}</span>
                        ${dueDateFormatted
                          ? html`<span class="overview-task__due-date">${dueDateFormatted}</span>`
                          : ''}
                      </div>
                    `;
                  })}
                </div>
              `}
        </div>
      `)}
    </div>
  `;
}
