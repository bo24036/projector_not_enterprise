import { html } from '/vendor/lit-html/lit-html.js';

export function SettingsModal({ allNames, suppressedNames, holdReviewDays, onSave, onClose, onExport, onImport }) {
  const handleSave = (e) => {
    const dialog = e.target.closest('dialog');
    const checked = [...dialog.querySelectorAll('.suppress-modal__checkbox:checked')].map(el => el.value);
    const days = parseInt(dialog.querySelector('.suppress-modal__days-input').value, 10);
    onSave(checked, isNaN(days) || days < 1 ? holdReviewDays : days);
  };

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
          />
          <span>days</span>
        </div>
      </section>

      <section class="suppress-modal__section">
        <h3 class="suppress-modal__section-title">Suppress from Autocomplete</h3>
        <p class="suppress-modal__description">Checked names will not appear in autocomplete suggestions.</p>
        <ul class="suppress-modal__list">
          ${allNames.map(name => html`
            <li class="suppress-modal__item">
              <label class="suppress-modal__label">
                <input
                  type="checkbox"
                  class="suppress-modal__checkbox"
                  value=${name}
                  ?checked=${suppressedNames.has(name)}
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
      </section>

      <div class="suppress-modal__controls">
        <button class="button-ok" @click=${handleSave}>Save</button>
        <button class="button-cancel" @click=${onClose}>Cancel</button>
      </div>
    </dialog>
  `;
}

// Keep old export name for any existing references during transition
export { SettingsModal as SuppressNamesModal };
