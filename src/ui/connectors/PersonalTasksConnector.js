import { html, render } from '/vendor/lit-html/lit-html.js';
import { TaskListItem } from '../components/TaskListItem.js';
import { TaskInput } from '../components/TaskInput.js';
import * as Task from '../../domains/Task.js';
import { dispatch } from '../../state.js';
import { makeTaskDisplayObject } from '../../utils/taskFormatting.js';

export function initPersonalTasksConnector(containerSelector, state) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const tasks = Task.getPersonalTasks();
  const { creatingTask, editingTaskId } = state;
  const editingTask = editingTaskId ? Task.getTask(editingTaskId) : null;

  const template = html`
    <div class="personal-tasks-page">
      <h1 class="personal-tasks-page__title">My Tasks</h1>

      <div class="personal-tasks-page__tasks">
        ${tasks.map(task => {
          const { dueDateFormatted, urgency } = makeTaskDisplayObject(task);
          return TaskListItem({
            task,
            dueDateFormatted,
            urgency,
            isArchived: false,
            isEditing: editingTaskId === task.id,
            editName: editingTask?.name ?? '',
            editDueDate: editingTask?.dueDate ? Task.formatDueDate(editingTask.dueDate) : '',
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
          });
        })}

        ${!creatingTask ? html`
          <div class="task-list-item task-list-item--placeholder">
            <button
              class="task-list-item__placeholder-button"
              @click=${() => dispatch({ type: 'START_CREATE_TASK' })}
            >
              [Click to add task...]
            </button>
          </div>
        ` : TaskInput({
          onSave: (name, dueDate) => {
            dispatch({
              type: 'CREATE_TASK',
              payload: { projectId: null, name, dueDate: dueDate || null },
            });
          },
          onCancel: () => {
            dispatch({ type: 'CANCEL_CREATE_TASK' });
          },
        })}
      </div>
    </div>
  `;

  render(template, container);
}
