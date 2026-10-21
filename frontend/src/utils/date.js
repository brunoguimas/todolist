const pad = (value) => String(value).padStart(2, '0');

/**
 * Normaliza o campo `due_date` (vindo do MySQL como Date ou string) para "YYYY-MM-DD".
 * O mysql2 converte DATE em Date no timezone local, por isso lemos os getters locais.
 */
export function toDateOnly(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }

  return null;
}

/** Data de hoje no formato "YYYY-MM-DD" (horário local). */
export function todayDateOnly() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Converte "YYYY-MM-DD" em Date à meia-noite local. */
export function fromDateOnly(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Tarefa atrasada: prazo já passou e continua pendente. */
export function isOverdue(task) {
  if (!task || task.completed) return false;
  const due = toDateOnly(task.due_date);
  if (!due) return false;
  return due < todayDateOnly();
}

/** Dias entre hoje e a data (negativo = prazo passado). */
export function daysUntil(iso) {
  const target = fromDateOnly(iso);
  if (!target) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** "20 out" / "20 out 2026" depending on whether the year is the current one. */
export function formatDueDate(value) {
  const iso = toDateOnly(value);
  if (!iso) return null;

  const date = fromDateOnly(iso);
  const currentYear = new Date().getFullYear();

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() !== currentYear ? { year: 'numeric' } : {}),
  })
    .replace('.', '')
    .replace(' de ', ' ');
}

/** Texto curto de prazo: "Hoje", "Amanhã", "Ontem" ou a data formatada. */
export function dueHint(value) {
  const iso = toDateOnly(value);
  if (!iso) return null;

  const diff = daysUntil(iso);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';

  return formatDueDate(iso);
}
