import * as Person from '../domains/Person.js';
import { registerHandler } from '../state.js';
import { createToggleCreateHandler, createEditHandlers, createNoOpLoadedHandler } from '../utils/handlerFactory.js';

registerHandler('CREATE_PERSON', (state, action) => {
  const { projectId, name, role } = action.payload;

  try {
    Person.createPerson(projectId, name, role);
    return { state: { ...state, creatingPerson: false } };
  } catch (error) {
    alert(error.message);
    return { state };
  }
});

registerHandler('UPDATE_PERSON', (state, action) => {
  const { personId, name, role } = action.payload;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;

  try {
    Person.updatePerson(personId, updates);
    return { state: { ...state, editingPersonId: null, editingPersonName: '', editingPersonRole: '' } };
  } catch (error) {
    console.error('Failed to update person:', error.message);
    return { state };
  }
});

registerHandler('DELETE_PERSON', (state, action) => {
  const { personId } = action.payload;

  try {
    Person.deletePerson(personId);
  } catch (error) {
    console.error('Failed to delete person:', error.message);
  }
  return { state };
});

// Create START_CREATE_PERSON and CANCEL_CREATE_PERSON handlers
createToggleCreateHandler('PERSON', 'creatingPerson');

// Create START_EDIT_PERSON and CANCEL_EDIT_PERSON handlers
createEditHandlers('PERSON', {
  getter: Person.getPerson,
  idPayloadKey: 'personId',
  stateIdKey: 'editingPersonId',
  stateKeys: ['editingPersonId', 'editingPersonName', 'editingPersonRole'],
  buildFieldState: (person) => ({
    editingPersonName: person.name,
    editingPersonRole: person.role,
  }),
});

// Create no-op handler that triggers re-render when person is loaded
createNoOpLoadedHandler('PERSON_LOADED');
