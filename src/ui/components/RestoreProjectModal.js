import { html } from '/vendor/lit-html/lit-html.js';

export function RestoreProjectModal({ onKeep, onClear, onClose }) {
  return html`
    <dialog class="restore-modal" @cancel=${onClose}>
      <h2 class="restore-modal__title">Restore Project</h2>
      <p class="restore-modal__description">What would you like to do with task due dates?</p>
      <div class="restore-modal__controls">
        <button class="restore-modal__btn restore-modal__btn--keep" @click=${onKeep}>Keep due dates</button>
        <button class="restore-modal__btn restore-modal__btn--clear" @click=${onClear}>Clear due dates</button>
      </div>
    </dialog>
  `;
}
