import { IconCalendar, IconEdit, IconTrash } from './icons';
import { dueHint, isOverdue } from '../utils/date';
import Checkbox from './Checkbox';

export default function TaskItem({ task, onToggle, onEdit, onDelete, busy }) {
  const overdue = isOverdue(task);
  const hint = dueHint(task.due_date);

  return (
    <li className={`task${task.completed ? ' is-completed' : ''}${overdue ? ' is-overdue' : ''}`}>
      <Checkbox
        checked={task.completed}
        disabled={busy}
        onChange={(checked) => onToggle(task.id, checked)}
        label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
      />

      <div className="task__content">
        <p className="task__title" title={task.title}>
          {task.title}
        </p>

        {task.due_date && (
          <span className={`task__due${overdue ? ' task__due--overdue' : ''}`}>
            <IconCalendar className="task__due-icon" />
            {hint}
          </span>
        )}
      </div>

      {overdue && (
        <span className="badge badge--overdue">
          Em atraso
        </span>
      )}

      <div className="task__actions">
        <button
          type="button"
          className="icon-button icon-button--edit"
          onClick={() => onEdit(task)}
          aria-label={`Editar ${task.title}`}
          title="Editar"
        >
          <IconEdit />
        </button>
        <button
          type="button"
          className="icon-button icon-button--delete"
          onClick={() => onDelete(task)}
          aria-label={`Excluir ${task.title}`}
          title="Excluir"
        >
          <IconTrash />
        </button>
      </div>
    </li>
  );
}
