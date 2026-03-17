import { html } from '/vendor/lit-html/lit-html.js';

export function SuppressNamesModal({ allNames, suppressedNames, onSave, onClose }) {
  const selection = new Set(suppressedNames);

  const handleCheckboxChange = (e, name) => {
    if (e.target.checked) {
      selection.add(name);
    } else {
      selection.delete(name);
    }
  };

  return html`
    <dialog class="suppress-modal" @cancel=${onClose}>
      <h2 class="suppress-modal__title">Suppress from Autocomplete</h2>
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
      <div class="suppress-modal__controls">
        <button class="button-ok" @click=${() => onSave([...selection])}>Save</button>
        <button class="button-cancel" @click=${onClose}>Cancel</button>
      </div>
    </dialog>
  `;
}
