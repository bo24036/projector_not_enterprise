import { html } from '/vendor/lit-html/lit-html.js';

export function DataModal({ onClose, onExport, onImport, backupDirName, onSetBackupDir }) {
  return html`
    <dialog class="data-modal" @cancel=${onClose}>
      <h2 class="data-modal__title">Data</h2>

      <section class="data-modal__section">
        <h3 class="data-modal__section-title">Export / Import</h3>
        <p class="data-modal__description">Export a backup of all your data, or import a previously exported file.</p>
        <div class="data-modal__actions">
          <button class="data-modal__btn" @click=${onExport}>Export</button>
          <label class="data-modal__btn data-modal__import-label">
            Import
            <input
              type="file"
              accept=".json"
              class="data-modal__import-input"
              @change=${(e) => {
                const file = e.target.files[0];
                if (file) onImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <section class="data-modal__section">
        <h3 class="data-modal__section-title">Auto-Backup</h3>
        <p class="data-modal__description">Automatically save a backup file to a local folder every 30 seconds.</p>
        <div class="data-modal__backup-row">
          <div class="data-modal__backup-status">
            <span class="data-modal__backup-dir">
              ${backupDirName
                ? `"${backupDirName}" (browser security limits display to folder name only)`
                : 'No folder set — changes will not be backed up automatically'}
            </span>
          </div>
          <button class="data-modal__btn" @click=${onSetBackupDir}>
            ${backupDirName ? 'Change' : 'Set folder'}
          </button>
        </div>
      </section>

      <div class="data-modal__controls">
        <button class="button-ok" @click=${onClose}>Close</button>
      </div>
    </dialog>
  `;
}
