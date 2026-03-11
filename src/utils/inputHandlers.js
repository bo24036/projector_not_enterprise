// Utilities for creating common input event handlers

/**
 * Creates a keydown handler for input forms.
 * Enter: Saves if primary field is non-empty
 * Escape: Cancels
 *
 * @param {object} config
 * @param {function} config.primaryFieldGetter - Returns the primary field value
 * @param {function} config.fieldValuesGetter - Returns array of all field values to pass to onSave
 * @param {function} config.onSave - Called with field values on Enter
 * @param {function} config.onCancel - Called on Escape
 *
 * @example
 * const handleKeyDown = makeKeyDownHandler({
 *   primaryFieldGetter: () => nameValue,
 *   fieldValuesGetter: () => [nameValue.trim(), dueDateValue.trim()],
 *   onSave: (name, dueDate) => dispatch({ type: 'CREATE_TASK', payload: { name, dueDate } }),
 *   onCancel: () => dispatch({ type: 'CANCEL_CREATE_TASK' }),
 * });
 */
export function makeKeyDownHandler({
  primaryFieldGetter,
  fieldValuesGetter,
  onSave,
  onCancel,
}) {
  return (event) => {
    if (event.key === 'Enter') {
      const primaryField = primaryFieldGetter();
      if (primaryField.trim()) {
        onSave(...fieldValuesGetter());
      }
    } else if (event.key === 'Escape') {
      onCancel();
    }
  };
}

/**
 * Creates a blur handler for input forms.
 * Cancels if primary field is empty, unless focus moved to another element in the same item.
 *
 * @param {object} config
 * @param {function} config.primaryFieldGetter - Returns the primary field value
 * @param {function} config.onCancel - Called if primary field is empty on blur
 * @param {string} config.itemSelector - Optional selector (e.g., '.task-list-item') to check if focus moved within same item
 *
 * @example
 * const handleBlur = makeBlurHandler({
 *   primaryFieldGetter: () => nameValue,
 *   onCancel: () => dispatch({ type: 'CANCEL_CREATE_TASK' }),
 *   itemSelector: '.task-list-item',
 * });
 */
export function makeBlurHandler({
  primaryFieldGetter,
  onCancel,
  itemSelector = null,
}) {
  return (event) => {
    // If focus is moving to another element within the same item, don't cancel
    if (itemSelector && event.relatedTarget) {
      const item = event.currentTarget.closest(itemSelector);
      if (item && item.contains(event.relatedTarget)) {
        return;
      }
    }
    // Only cancel if primary field is empty
    if (!primaryFieldGetter().trim()) {
      onCancel();
    }
  };
}
