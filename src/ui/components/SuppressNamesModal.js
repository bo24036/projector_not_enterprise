import { html } from '/vendor/lit-html/lit-html.js';

export function SettingsModal({
  allNames,
  suppressedNames,
  holdReviewDays,
  onClose,
  onToggleSuppress,
  onHoldReviewDaysChange,
  onExport,
  onImport,
  backupDirName,
  onSetBackupDir,
}) {
  let filterValue = '';

  function handleFilterInput(e) {
    filterValue = e.target.value;
    const q = filterValue.toLowerCase();
    const dialog = e.target.closest('dialog');
    dialog.querySelectorAll('.suppress-modal__item').forEach(li => {
      const name = li.dataset.name.toLowerCase();
      li.hidden = q ? !name.includes(q) : false;
    });
  }

  function handleDaysChange(e) {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days >= 1) onHoldReviewDaysChange(days);
  }

  return html`
    <dialog class="suppress-modal" @cancel=${onClose}>
      <h2 class="suppress-modal__title">Settings</h2>

      <section class="suppress-modal__section">
        <h3 class="suppress-modal__section-title">Hold Review Period</h3>
        <p class="suppress-modal__description">Remind me to review held projects after this many days.</p>
        <div class="suppress-modal__review-days">
          <input
            class="suppress-modal__days-input"
            type="number"
            min="1"
            .value=${String(holdReviewDays)}
            @change=${handleDaysChange}
            @blur=${handleDaysChange}
          />
          <span>days</span>
        </div>
      </section>

      <section class="suppress-modal__section suppress-modal__section--suppress">
        <h3 class="suppress-modal__section-title">Suppress from Autocomplete</h3>
        <p class="suppress-modal__description">Checked names will not appear in autocomplete suggestions.</p>
        ${allNames.length > 6 ? html`
          <input
            class="suppress-modal__filter"
            type="search"
            placeholder="Filter names..."
            .value=${filterValue}
            @input=${handleFilterInput}
          />
        ` : ''}
        <ul class="suppress-modal__list">
          ${allNames.map(name => html`
            <li class="suppress-modal__item" data-name=${name}>
              <label class="suppress-modal__label">
                <input
                  type="checkbox"
                  class="suppress-modal__checkbox"
                  value=${name}
                  ?checked=${suppressedNames.has(name)}
                  @change=${() => onToggleSuppress(name)}
                />
                ${name}
              </label>
            </li>
          `)}
        </ul>
      </section>

      <section class="suppress-modal__section">
        <h3 class="suppress-modal__section-title">Data</h3>
        <p class="suppress-modal__description">Export a backup of all your data, or import a previously exported file.</p>
        <div class="suppress-modal__data-actions">
          <button class="suppress-modal__data-btn" @click=${onExport}>Export</button>
          <label class="suppress-modal__data-btn suppress-modal__import-label">
            Import
            <input
              type="file"
              accept=".json"
              class="suppress-modal__import-input"
              @change=${(e) => {
                const file = e.target.files[0];
                if (file) onImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div class="suppress-modal__backup-row">
          <div class="suppress-modal__backup-status">
            <span class="suppress-modal__backup-label">Auto-backup folder</span>
            <span class="suppress-modal__backup-dir">
              ${backupDirName ? `"${backupDirName}" (browser security limits display to folder name only)` : 'No folder set — changes will not be backed up automatically'}
            </span>
          </div>
          <button class="suppress-modal__data-btn" @click=${onSetBackupDir}>
            ${backupDirName ? 'Change' : 'Set folder'}
          </button>
        </div>
      </section>

      <div class="suppress-modal__controls">
        <button class="button-ok" @click=${onClose}>Close</button>
      </div>
    </dialog>
  `;
}

// Keep old export name for any existing references during transition
export { SettingsModal as SuppressNamesModal };
