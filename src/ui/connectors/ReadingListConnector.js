import { html, render } from '/vendor/lit-html/lit-html.js';
import { keyed } from '/vendor/lit-html/directives/keyed.js';
import { focusAutofocusElement } from '../../utils/domHelpers.js';
import { ReadingListItem } from '../components/ReadingListItem.js';
import { ReadingListInput } from '../components/ReadingListInput.js';
import * as ReadingList from '../../domains/ReadingList.js';
import { getPersonNameOptions } from '../../utils/getPersonNameOptions.js';
import { dispatch } from '../../state.js';

export function initReadingListConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const { creatingReadingListItem, editingReadingListItemId, showReadingListRead, readingListFormKey } = state;

  const allItems = ReadingList.getAllReadingListItems();
  const recommenderOptions = getPersonNameOptions();

  const searchQuery = state.readingListSearch ?? '';
  const query = searchQuery.toLowerCase();

  function matchesSearch(item) {
    if (!query) return true;
    return (
      item.content.toLowerCase().includes(query) ||
      item.link.toLowerCase().includes(query) ||
      item.recommendedBy.toLowerCase().includes(query)
    );
  }

  const unreadItems = allItems.filter(i => !i.read && matchesSearch(i));
  const readItems = allItems.filter(i => i.read && matchesSearch(i));
  const unreadCount = allItems.filter(i => !i.read).length;

  function renderItem(item) {
    const isEditing = editingReadingListItemId === item.id;
    return ReadingListItem({
      item,
      isEditing,
      recommenderOptions,
      onToggleRead: () => dispatch({ type: 'TOGGLE_READING_LIST_ITEM_READ', payload: { itemId: item.id } }),
      onEdit: () => dispatch({ type: 'START_EDIT_READING_LIST_ITEM', payload: { itemId: item.id } }),
      onDelete: () => dispatch({ type: 'DELETE_READING_LIST_ITEM', payload: { itemId: item.id } }),
      onSave: (content, link, recommendedBy) => dispatch({
        type: 'UPDATE_READING_LIST_ITEM',
        payload: { itemId: item.id, content, link, recommendedBy },
      }),
      onCancel: () => dispatch({ type: 'CANCEL_EDIT_READING_LIST_ITEM' }),
    });
  }

  let createTemplate = null;
  if (creatingReadingListItem) {
    createTemplate = keyed(readingListFormKey, ReadingListInput({
      recommenderOptions,
      onSave: (content, link, recommendedBy) => dispatch({
        type: 'CREATE_READING_LIST_ITEM',
        payload: { content, link, recommendedBy },
      }),
      onCancel: () => dispatch({ type: 'CANCEL_CREATE_READING_LIST_ITEM' }),
    }));
  }

  const template = html`
    <div class="reading-list-page">
      <h1 class="reading-list-page__title">Reading List</h1>

      <div class="reading-list-page__toolbar">
        <input
          class="reading-list-page__search"
          type="search"
          placeholder="Search..."
          .value=${searchQuery}
          @input=${e => dispatch({ type: 'SET_READING_LIST_SEARCH', payload: { query: e.target.value } })}
        />
        ${unreadCount > 0 ? html`<span class="reading-list-page__count">${unreadCount} unread</span>` : ''}
      </div>

      <div class="reading-list-page__section">
        <div class="reading-list-page__items">
          ${unreadItems.map(renderItem)}

          ${!creatingReadingListItem ? html`
            <div class="reading-list-item reading-list-item--placeholder">
              <button
                class="reading-list-item__placeholder-button"
                @click=${() => dispatch({ type: 'START_CREATE_READING_LIST_ITEM' })}
              >[Add item...]</button>
            </div>
          ` : createTemplate}
        </div>
      </div>

      ${readItems.length > 0 || (allItems.some(i => i.read) && !query) ? html`
        <div class="reading-list-page__section reading-list-page__section--read">
          <button
            class="reading-list-page__read-toggle"
            @click=${() => dispatch({ type: 'TOGGLE_READING_LIST_READ_VISIBILITY' })}
          >
            ${showReadingListRead ? '▾' : '▸'} Read (${allItems.filter(i => i.read).length})
          </button>
          ${showReadingListRead ? html`
            <div class="reading-list-page__items reading-list-page__items--read">
              ${readItems.map(renderItem)}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  render(template, container);
  focusAutofocusElement(container);
}
