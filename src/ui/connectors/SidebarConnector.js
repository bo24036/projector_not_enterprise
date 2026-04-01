import { html, render } from '/vendor/lit-html/lit-html.js';
import { focusAutofocusElement } from '../../utils/domHelpers.js';
import { ProjectListItem } from '../components/ProjectListItem.js';
import { ProjectNewItem } from '../components/ProjectNewItem.js';
import { ProjectInput } from '../components/ProjectInput.js';
import { SettingsModal } from '../components/SuppressNamesModal.js';
import * as Project from '../../domains/Project.js';
import * as Task from '../../domains/Task.js';
import * as Person from '../../domains/Person.js';
import * as Settings from '../../domains/Settings.js';
import { dispatch } from '../../state.js';
import { navigateToProject, navigateToOverview, navigateToPersonal, navigateToReport, navigateToReadingList } from '../../utils/router.js';
import * as ReadingList from '../../domains/ReadingList.js';

const MS_PER_DAY = 86400000;

export function initSidebarConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const allProjects = Project.getAllProjects() || [];
  const activeProjects = allProjects.filter(p => !p.archived);
  const archivedProjects = allProjects.filter(p => p.archived);
  const holdReviewDays = Settings.getHoldReviewDays();

  // Non-held active projects drive overview counts, urgency, progress
  const nonHeldProjects = activeProjects.filter(p => p.heldAt === null);

  const personalTaskCount = Task.getOpenTaskCount(null);
  const readingListUnreadCount = ReadingList.getAllReadingListItems().filter(i => !i.read).length;
  const overviewTaskCount = nonHeldProjects.reduce((sum, p) => sum + Task.getOpenTaskCount(p.id), 0) + personalTaskCount;

  const URGENCY_RANK = { red: 0, orange: 1, yellow: 2, gray: 3 };
  const personalUrgency = Task.getProjectUrgency(null);
  const overviewUrgency = [...nonHeldProjects.map(p => Task.getProjectUrgency(p.id)), personalUrgency]
    .reduce((worst, u) => URGENCY_RANK[u] < URGENCY_RANK[worst] ? u : worst, 'gray');

  const allNames = Person.getAllUniquePersonNamesRaw() || [];
  const suppressedNames = Person.getSuppressedNames();

  // Create new project item
  const newProjectItem = state.isCreatingProject
    ? ProjectInput({
        onSave: handleSave,
        onCancel: () => dispatch({ type: 'CANCEL_CREATE_PROJECT' }),
      })
    : ProjectNewItem({
        onStartCreate: () => dispatch({ type: 'START_CREATE_PROJECT' }),
      });

  // Render archived projects only if toggle is enabled and there are archived projects
  const archivedList = state.showArchivedProjects && archivedProjects.length > 0
    ? html`
      <div class="sidebar__archived-list">
        ${archivedProjects.map(project =>
          ProjectListItem({
            project,
            isSelected: state.currentProjectId === project.id,
            onSelect: () => navigateToProject(project.id),
          })
        )}
      </div>
    `
    : html``;

  const archivedToggleIndicator = state.showArchivedProjects ? '▼' : '▶';

  const template = html`
    <div class="sidebar">
      <div class="sidebar__header">
        <h1 class="sidebar__title">Projector</h1>
      </div>

      <button class="sidebar__overview-btn urgency-${overviewUrgency} ${state.currentPage === 'overview' ? 'is-active' : ''}" @click=${navigateToOverview}>
        Overview
        ${overviewTaskCount > 0 ? html`<span class="sidebar__count">${overviewTaskCount}</span>` : ''}
      </button>

      <button class="sidebar__personal-btn urgency-${personalUrgency} ${state.currentPage === 'personal' ? 'is-active' : ''}" @click=${navigateToPersonal}>
        My Tasks
        ${personalTaskCount > 0 ? html`<span class="sidebar__count">${personalTaskCount}</span>` : ''}
      </button>

      <button class="sidebar__reading-list-btn ${state.currentPage === 'readingList' ? 'is-active' : ''}" @click=${navigateToReadingList}>
        Reading List
        ${readingListUnreadCount > 0 ? html`<span class="sidebar__count">${readingListUnreadCount}</span>` : ''}
      </button>

      <div class="sidebar__projects-header">Projects</div>

      <div class="sidebar__list">
        ${activeProjects.map(project => {
          const isHeld = project.heldAt !== null;
          const isReviewDue = isHeld && (Date.now() - project.heldAt > holdReviewDays * MS_PER_DAY);
          return ProjectListItem({
            project,
            isSelected: state.currentProjectId === project.id,
            openTaskCount: isHeld ? 0 : Task.getOpenTaskCount(project.id),
            urgency: isHeld ? null : Task.getProjectUrgency(project.id),
            isHeld,
            isReviewDue,
            onSelect: () => navigateToProject(project.id),
          });
        })}
        ${newProjectItem}
      </div>

      <div class="sidebar__archived-section">
        <button class="sidebar__archived-header" @click=${() => dispatch({ type: 'TOGGLE_ARCHIVED_PROJECTS' })}>
          <span class="sidebar__archived-indicator">${archivedToggleIndicator}</span>
          Archived
        </button>
        ${archivedList}
      </div>

      <div class="sidebar__footer">
        <button class="sidebar__report-btn ${state.currentPage === 'yearEndReport' ? 'is-active' : ''}" @click=${navigateToReport}>
          Year-End Report
        </button>
        <button class="sidebar__suppress-btn"
          @click=${() => dispatch({ type: 'OPEN_SETTINGS_MODAL' })}>
          Settings
        </button>
      </div>
    </div>

    ${state.showSettingsModal
      ? SettingsModal({
          allNames,
          suppressedNames,
          holdReviewDays,
          onSave: (names, days) => {
            dispatch({ type: 'UPDATE_SUPPRESSED_NAMES', payload: { names } });
            dispatch({ type: 'UPDATE_HOLD_REVIEW_DAYS', payload: { days } });
            dispatch({ type: 'CLOSE_SETTINGS_MODAL' });
          },
          onClose: () => dispatch({ type: 'CLOSE_SETTINGS_MODAL' }),
          onExport: () => dispatch({ type: 'EXPORT_DATA' }),
          onImport: (file) => dispatch({ type: 'IMPORT_DATA', payload: { file } }),
        })
      : ''
    }
  `;

  render(template, container);

  focusAutofocusElement(container);

  // Call showModal() on the dialog when it's visible
  requestAnimationFrame(() => {
    if (state.showSettingsModal) {
      const dialog = container.querySelector('.suppress-modal');
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    }
  });

  function handleSave(name) {
    dispatch({ type: 'CREATE_PROJECT', payload: { name } });
  }
}
