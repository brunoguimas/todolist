import { toDateOnly } from './date';

/**
 * Ordena as tarefas pela data mais próxima primeiro.
 * Tarefas sem prazo vão para o final; dentro do mesmo prazo, as pendentes
 * aparecem antes das concluídas e as mais recentes primeiro.
 */
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aDue = toDateOnly(a.due_date);
    const bDue = toDateOnly(b.due_date);

    if (aDue && bDue && aDue !== bDue) {
      return aDue < bDue ? -1 : 1;
    }

    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return b.id - a.id;
  });
}

/** Normaliza o registro vindo da API (`completed` chega como 0/1 do MySQL). */
export function normalizeTask(task) {
  return {
    ...task,
    completed: Boolean(task.completed),
    due_date: toDateOnly(task.due_date),
  };
}
