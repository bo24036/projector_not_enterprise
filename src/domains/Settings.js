import { getSettingFromIdb, putSettingToIdb } from '../utils/IdbService.js';
import { createPersistenceQueue } from '../utils/PersistenceQueue.js';

const HOLD_REVIEW_DAYS_DEFAULT = 30;
let holdReviewDays = HOLD_REVIEW_DAYS_DEFAULT;

const serialize = createPersistenceQueue({ put: putSettingToIdb }, 'setting');

export function getHoldReviewDays() {
  return holdReviewDays;
}

export function setHoldReviewDays(days) {
  holdReviewDays = days;
  serialize({ id: 'hold-review-days', value: days }, 'put');
}

export async function preloadSettings() {
  try {
    const setting = await getSettingFromIdb('hold-review-days');
    if (setting && typeof setting.value === 'number') {
      holdReviewDays = setting.value;
    }
  } catch (error) {
    console.error('Failed to preload settings:', error.message);
  }
}
