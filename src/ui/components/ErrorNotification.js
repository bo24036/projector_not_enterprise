import { html } from '/vendor/lit-html/lit-html.js';
import { dispatch } from '../../state.js';

export function ErrorNotification({ error }) {
  if (!error) return html``;

  function handleDismiss() {
    dispatch({ type: 'CLEAR_ERROR' });
  }

  return html`
    <div class="error-notification">
      <div class="error-notification__content">
        <span class="error-notification__icon">⚠️</span>
        <span class="error-notification__message">${error.message}</span>
        <button
          class="error-notification__close"
          @click=${handleDismiss}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  `;
}
