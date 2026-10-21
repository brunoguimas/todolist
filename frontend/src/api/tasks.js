const DEFAULT_API_URL = 'http://localhost:3333';

/** Lida em tempo de chamada para respeitar mudanças no ambiente em runtime. */
function apiUrl() {
  return (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${apiUrl()}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Não foi possível conectar à API. O servidor está rodando?');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `Erro ${response.status} ao chamar a API.`);
  }

  return payload;
}

function toQuery({ search = '', status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (status && status !== 'all') params.set('status', status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Lista as tarefas. A API já devolve `total` e `completed` do banco inteiro. */
export async function listTasks(params) {
  return request(`/api/tasks${toQuery(params)}`);
}

/** Cria uma tarefa: `{ title, dueDate? }` (dueDate no formato YYYY-MM-DD). */
export async function createTask({ title, dueDate }) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, dueDate: dueDate || null }),
  });
}

/** Atualiza uma tarefa: `{ completed?, title?, dueDate? }`. */
export async function updateTask(id, changes) {
  return request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

/** Exclui uma tarefa. */
export async function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' });
}

/** Verifica se a API está no ar. */
export async function checkHealth() {
  return request('/health');
}
