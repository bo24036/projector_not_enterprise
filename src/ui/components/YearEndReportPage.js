import { html } from '/vendor/lit-html/lit-html.js';

export function YearEndReportPage({ year, rows, onYearChange }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return html`
    <div class="year-end-report">
      <div class="year-end-report__header">
        <h1 class="year-end-report__title">Year-End Report</h1>
        <div class="year-end-report__controls">
          <label class="year-end-report__label" for="year-select">Year</label>
          <select
            id="year-select"
            class="year-end-report__year-select"
            @change=${(e) => onYearChange(Number(e.target.value))}
          >
            ${yearOptions.map(y => html`
              <option value=${y} ?selected=${y === year}>${y}</option>
            `)}
          </select>
        </div>
      </div>

      <p class="year-end-report__summary">
        ${rows.length} project${rows.length !== 1 ? 's' : ''} active during ${year}
      </p>

      ${rows.length === 0
        ? html`<div class="year-end-report__empty">No projects were active during ${year}.</div>`
        : html`
          <div class="year-end-report__table-wrapper">
            <table class="year-end-report__table">
              <thead>
                <tr>
                  <th class="year-end-report__th">Project</th>
                  <th class="year-end-report__th">Description</th>
                  <th class="year-end-report__th year-end-report__th--num">Tasks</th>
                  <th class="year-end-report__th">Start Date</th>
                  <th class="year-end-report__th">End Date</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => html`
                  <tr class="year-end-report__row">
                    <td class="year-end-report__td year-end-report__td--name">
                      <button class="year-end-report__project-link" @click=${row.onProjectClick}>${row.name}</button>
                    </td>
                    <td class="year-end-report__td year-end-report__td--desc">${row.description || '—'}</td>
                    <td class="year-end-report__td year-end-report__td--num">${row.completedTasks} / ${row.totalTasks}</td>
                    <td class="year-end-report__td">${row.startDate}</td>
                    <td class="year-end-report__td year-end-report__td--end">${row.endDate}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `
      }
    </div>
  `;
}
