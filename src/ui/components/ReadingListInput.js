import { html } from '/vendor/lit-html/lit-html.js';
import { makeDatalistId } from '../../utils/domUtils.js';

// Dumb component for creating or editing a reading list item.
// onSave(content, link, recommendedBy, tags) — tags is an array
// onCancel() — cancel and dismiss
//
// Tag chips are wired imperatively after lit-html renders to avoid nested
// render() calls fighting the outer template. After calling render(), call
// initReadingListTags(container) where container is the element passed to render().
export function ReadingListInput({ onSave, onCancel, recommenderOptions = [], tagOptions = [], initial = {} }) {
  let contentValue = initial.content ?? '';
  let linkValue = initial.link ?? '';
  let recommendedByValue = initial.recommendedBy ?? '';

  const selectedTags = new Set(initial.tags ?? []);

  const recommenderListId = makeDatalistId('rl-recommender-list');

  function allKnownTags() {
    const extra = [...selectedTags].filter(t => !tagOptions.includes(t));
    return [...tagOptions, ...extra];
  }

  function syncChips(chipsEl) {
    if (!chipsEl) return;
    allKnownTags().forEach(tag => {
      let chip = Array.from(chipsEl.children).find(el => el.dataset.tag === tag);
      if (!chip) {
        chip = document.createElement('label');
        chip.className = 'reading-list-input__tag-chip';
        chip.dataset.tag = tag;
        const check = document.createElement('span');
        check.className = 'reading-list-input__tag-check';
        check.textContent = '✓';
        chip.appendChild(check);
        chip.appendChild(document.createTextNode('\u00a0' + tag));
        chip.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent blur on new-tag input before click resolves
          selectedTags.has(tag) ? selectedTags.delete(tag) : selectedTags.add(tag);
          syncChips(chipsEl);
        });
        chipsEl.appendChild(chip);
      }
      chip.classList.toggle('is-selected', selectedTags.has(tag));
    });
  }

  function commitNewTagInput(inputEl, chipsEl) {
    const val = inputEl.value;
    if (!val.trim()) return;
    val.split(',').map(t => t.trim()).filter(Boolean).forEach(t => selectedTags.add(t));
    inputEl.value = '';
    syncChips(chipsEl);
  }

  function collectTags(container) {
    const pending = container?.querySelector('.reading-list-input__new-tag')?.value ?? '';
    pending.split(',').map(t => t.trim()).filter(Boolean).forEach(t => selectedTags.add(t));
    return [...selectedTags];
  }

  function handleSave(e) {
    if (!contentValue.trim()) return;
    const container = e.target.closest('.reading-list-item--editing');
    onSave(contentValue.trim(), linkValue.trim(), recommendedByValue.trim(), collectTags(container));
  }

  function handleKeyDown(event) {
    if (event.target.classList.contains('reading-list-input__new-tag')) return;
    if (event.key === 'Enter' && !event.shiftKey && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      handleSave(event);
    } else if (event.key === 'Escape') {
      onCancel();
    }
  }

  function handleTextareaKeyDown(event) {
    if (event.key === 'Escape') { onCancel(); return; }
    if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); handleSave(event); }
  }

  // Store init fn on the template result so the connector can call it after render
  const template = html`
    <div class="reading-list-item reading-list-item--editing" @keydown=${handleKeyDown}>
      <div class="reading-list-input__fields">
        <textarea
          ?autofocus=${true}
          data-autofocus
          class="reading-list-input__field reading-list-input__field--content"
          placeholder="Content (required)..."
          .value=${contentValue}
          @input=${e => { contentValue = e.target.value; }}
          @keydown=${handleTextareaKeyDown}
          rows="2"
        ></textarea>
        <input
          class="reading-list-input__field reading-list-input__field--link"
          type="text"
          placeholder="Link or [label](url)..."
          .value=${linkValue}
          @input=${e => { linkValue = e.target.value; }}
        />
        <input
          class="reading-list-input__field reading-list-input__field--recommended-by"
          type="text"
          placeholder="Recommended by..."
          .value=${recommendedByValue}
          list=${recommenderListId}
          @input=${e => { recommendedByValue = e.target.value; }}
        />
        <datalist id=${recommenderListId}>
          ${recommenderOptions.map(name => html`<option value=${name}></option>`)}
        </datalist>

        <div class="reading-list-input__tags-region">
          <input
            type="text"
            class="reading-list-input__new-tag"
            placeholder="Add tag..."
          />
          <div class="reading-list-input__chips"></div>
        </div>
      </div>
      <div class="reading-list-input__controls">
        <button class="button-ok" @click=${handleSave} title="Save">✓</button>
        <button class="button-cancel" @click=${onCancel} title="Cancel">✕</button>
      </div>
    </div>
  `;

  // Attach the init function to the template result for the connector to call after render()
  template._initTags = (parentEl) => {
    const editingEl = parentEl.querySelector('.reading-list-item--editing');
    if (!editingEl) return;
    const chipsEl = editingEl.querySelector('.reading-list-input__chips');
    const newTagInput = editingEl.querySelector('.reading-list-input__new-tag');
    if (!chipsEl || !newTagInput) return;

    syncChips(chipsEl);

    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCancel(); return; }
      if (e.key === ',') { e.preventDefault(); commitNewTagInput(newTagInput, chipsEl); }
    });
    newTagInput.addEventListener('blur', (e) => {
      const related = e.relatedTarget;
      if (related && (related.classList.contains('button-ok') || related.classList.contains('button-cancel'))) return;
      commitNewTagInput(newTagInput, chipsEl);
    });
  };

  return template;
}
