import { html } from '/vendor/lit-html/lit-html.js';

export function SettingsModal({ allNames, suppressedNames, holdReviewDays, onSave, onClose }) {
  const selection = new Set(suppressedNames);
  let reviewDays = holdReviewDays;

  const handleCheckboxChange = (e, name) => {
    if (e.target.checked) {
      selection.add(name);
    } else {
      selection.delete(name);
    }
  };

  const handleReviewDaysChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) reviewDays = val;
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
            @change=${handleReviewDaysChange}
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
                  ?checked=${suppressedNames.has(name)}
                  @change=${(e) => handleCheckboxChange(e, name)}
                />
                ${name}
              </label>
            </li>
          `)}
        </ul>
      </section>

      <div class="suppress-modal__controls">
        <button class="button-ok" @click=${() => onSave([...selection], reviewDays)}>Save</button>
        <button class="button-cancel" @click=${onClose}>Cancel</button>
      </div>
    </dialog>
  `;
}

// Keep old export name for any existing references during transition
export { SettingsModal as SuppressNamesModal };
