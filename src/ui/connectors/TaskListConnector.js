import { html } from 'https://unpkg.com/lit-html@2/lit-html.js';
import { TaskListItem } from '../components/TaskListItem.js';
import { TaskInput } from '../components/TaskInput.js';
import * as Task from '../../domains/Task.js';
import { dispatch } from '../../state.js';

export function TaskListConnector({ projectId, state }) {
  const tasks = Task.getTasksByProjectId(projectId);
  const { creatingTask, editingTaskId, editingTaskName, editingTaskDueDate } = state;

  return html`
    <div class="task-list">
      ${creatingTask ? TaskInput({
        onSave: (name, dueDate) => {
          dispatch({
            type: 'CREATE_TASK',
            payload: { projectId, name, dueDate: dueDate || null },
          });
        },
        onCancel: () => {
          dispatch({ type: 'CANCEL_CREATE_TASK' });
        },
      }) : ''}

      ${tasks.length > 0
        ? html`
            ${tasks.map(task =>
              TaskListItem({
                task,
                isEditing: editingTaskId === task.id,
                editName: editingTaskName,
                editDueDate: editingTaskDueDate,
                onToggle: () => {
                  dispatch({ type: 'TOGGLE_TASK_COMPLETED', payload: { taskId: task.id } });
                },
                onEdit: () => {
                  dispatch({ type: 'START_EDIT_TASK', payload: { taskId: task.id } });
                },
                onDelete: () => {
                  dispatch({ type: 'DELETE_TASK', payload: { taskId: task.id } });
                },
                onSave: (name, dueDate) => {
                  dispatch({
                    type: 'UPDATE_TASK',
                    payload: { taskId: task.id, name, dueDate: dueDate || null, completed: task.completed },
                  });
                },
                onCancel: () => {
                  dispatch({ type: 'CANCEL_EDIT_TASK' });
                },
              })
            )}
          `
        : ''}

      ${!creatingTask
        ? html`
            <div class="task-list-item task-list-item--placeholder">
              <button
                class="task-list-item__placeholder-button"
                @click=${() => dispatch({ type: 'START_CREATE_TASK' })}
              >
                [Click to add task...]
              </button>
            </div>
          `
        : ''}
    </div>
  `;
}
