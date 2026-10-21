import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks';

// Porta exclusiva do teste: não colide com o backend em desenvolvimento (:3333).
const PORT = 3399;
const API_URL = `http://127.0.0.1:${PORT}`;

let server;
let tasks;

function reset() {
  tasks = [
    { id: 1, title: 'Tarefa A', completed: 0, due_date: '2026-10-20', created_at: '2026-10-01 10:00:00' },
    { id: 2, title: 'Tarefa B', completed: 1, due_date: null, created_at: '2026-10-02 10:00:00' },
  ];
}

beforeAll(async () => {
  vi.stubEnv('VITE_API_URL', API_URL);
  reset();

  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, API_URL);
    const send = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(payload === null ? '' : JSON.stringify(payload));
    };

    if (url.pathname === '/api/tasks' && req.method === 'GET') {
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const rows = tasks.filter((task) => task.title.toLowerCase().includes(search));
      return send(200, {
        tasks: rows,
        total: tasks.length,
        completed: tasks.filter((task) => task.completed).length,
      });
    }

    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      if (!body.title || !body.title.trim()) {
        return send(400, { message: 'O nome da tarefa é obrigatório.' });
      }
      const task = {
        id: Math.max(0, ...tasks.map((t) => t.id)) + 1,
        title: body.title.trim(),
        completed: 0,
        due_date: body.dueDate || null,
        created_at: '2026-10-03 10:00:00',
      };
      tasks.push(task);
      return send(201, task);
    }

    const match = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      const index = tasks.findIndex((task) => task.id === id);

      if (req.method === 'PATCH') {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const body = JSON.parse(raw || '{}');
        if (index === -1) return send(404, { message: 'Tarefa não encontrada.' });
        const task = { ...tasks[index] };
        if (typeof body.completed === 'boolean') task.completed = body.completed ? 1 : 0;
        if (typeof body.title === 'string' && body.title.trim()) task.title = body.title.trim();
        if (body.dueDate !== undefined) task.due_date = body.dueDate || null;
        tasks[index] = task;
        return send(200, task);
      }

      if (req.method === 'DELETE') {
        if (index === -1) return send(404, { message: 'Tarefa não encontrada.' });
        tasks.splice(index, 1);
        return send(204, null);
      }
    }

    return send(404, { message: 'Rota não encontrada.' });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Cliente da API', () => {
  it('lista as tarefas com os contadores', async () => {
    reset();
    const data = await listTasks({ search: '' });

    expect(data.tasks).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.completed).toBe(1);
  });

  it('filtra por termo de busca', async () => {
    reset();
    const data = await listTasks({ search: 'tarefa b' });

    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].title).toBe('Tarefa B');
  });

  it('cria uma tarefa com data limite', async () => {
    reset();
    const task = await createTask({ title: 'Nova', dueDate: '2026-11-01' });

    expect(task).toMatchObject({ title: 'Nova', due_date: '2026-11-01', completed: 0 });
  });

  it('atualiza uma tarefa', async () => {
    reset();
    const task = await updateTask(1, { completed: true, title: 'Tarefa A editada' });

    expect(task).toMatchObject({ id: 1, completed: 1, title: 'Tarefa A editada' });
  });

  it('exclui uma tarefa (204 sem corpo)', async () => {
    reset();
    await expect(deleteTask(1)).resolves.toBeNull();

    const data = await listTasks({});
    expect(data.tasks).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it('propaga a mensagem de erro da API', async () => {
    reset();
    await expect(createTask({ title: '   ' })).rejects.toThrow('O nome da tarefa é obrigatório.');
  });

  it('propaga erro 404 ao excluir tarefa inexistente', async () => {
    reset();
    await expect(deleteTask(999)).rejects.toThrow('Tarefa não encontrada.');
  });
});
