import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createEditHandlers, createMutationHandler } from '../utils/handlerFactory.js';
import * as ReadingList from '../domains/ReadingList.js';

registerHandler('SELECT_READING_LIST', (state) => {
  return {
    state: {
      ...state,
      currentPage: 'readingList',
      currentProjectId: null,
      creatingReadingListItem: false,
      editingReadingListItemId: null,
      readingListSearch: '',
    },
  };
});

registerHandler('CREATE_READING_LIST_ITEM', (state, action) => {
  const { content, link, recommendedBy, tags } = action.payload;
  try {
    ReadingList.createReadingListItem(content, { link, recommendedBy, tags });
    return { state: { ...state, creatingReadingListItem: false } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: { actionType: 'CREATE_READING_LIST_ITEM', message: error.message, timestamp: Date.now() },
      },
    };
  }
});

registerHandler('UPDATE_READING_LIST_ITEM', (state, action) => {
  const { itemId, content, link, recommendedBy, tags } = action.payload;
  try {
    ReadingList.updateReadingListItem(itemId, { content, link, recommendedBy, tags });
    return { state: { ...state, editingReadingListItemId: null } };
  } catch (error) {
    return {
      state: {
        ...state,
        lastError: { actionType: 'UPDATE_READING_LIST_ITEM', message: error.message, timestamp: Date.now() },
      },
    };
  }
});

createMutationHandler('DELETE_READING_LIST_ITEM', ({ itemId }) => {
  ReadingList.deleteReadingListItem(itemId);
});

createMutationHandler('TOGGLE_READING_LIST_ITEM_READ', ({ itemId }) => {
  const item = ReadingList.getReadingListItem(itemId);
  if (!item) return;
  if (item.read) {
    ReadingList.markUnread(itemId);
  } else {
    ReadingList.markRead(itemId);
  }
});

registerHandler('TOGGLE_READING_LIST_READ_VISIBILITY', (state) => {
  return { state: { ...state, showReadingListRead: !state.showReadingListRead } };
});

registerHandler('SET_READING_LIST_SEARCH', (state, action) => {
  return { state: { ...state, readingListSearch: action.payload.query } };
});

createToggleCreateHandler('READING_LIST_ITEM', 'creatingReadingListItem');

createEditHandlers('READING_LIST_ITEM', {
  getter: ReadingList.getReadingListItem,
  idPayloadKey: 'itemId',
  stateIdKey: 'editingReadingListItemId',
});
