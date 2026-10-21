import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';
import '../index.css';

const API_URL = 'http://localhost:3333';

function shiftDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createFetchMock(initialTasks) {
  let tasks = initialTasks.map((task) => ({ completed: 0, due_date: null, ...task }));
  const calls = [];

  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method ?? 'GET';
    const parsed = new URL(url, API_URL);
    const body = options.body ? JSON.parse(options.body) : undefined;

    calls.push({ method, url: String(url), body });

    const respond = (status, payload) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    });

    if (method === 'GET') {
      const search = (parsed.searchParams.get('search') ?? '').toLowerCase();
      const rows = tasks.filter((task) => task.title.toLowerCase().includes(search));
      return respond(200, {
        tasks: rows,
        total: tasks.length,
        completed: tasks.filter((task) => task.completed).length,
      });
    }

    if (method === 'POST') {
      const task = {
        id: Math.max(0, ...tasks.map((t) => t.id)) + 1,
        title: body.title,
        completed: 0,
        due_date: body.dueDate ?? null,
      };
      tasks = [...tasks, task];
      return respond(201, task);
    }

    const id = Number(parsed.pathname.split('/').pop());
    const index = tasks.findIndex((task) => task.id === id);

    if (method === 'PATCH') {
      const task = { ...tasks[index] };
      if (typeof body.completed === 'boolean') task.completed = body.completed ? 1 : 0;
      if (body.title) task.title = body.title;
      if (body.dueDate !== undefined) task.due_date = body.dueDate || null;
      tasks = tasks.map((item) => (item.id === id ? task : item));
      return respond(200, task);
    }

    if (method === 'DELETE') {
      tasks = tasks.filter((task) => task.id !== id);
      return respond(204, null);
    }

    return respond(404, { message: 'Not found' });
  });

  return { fetchMock, calls, getTasks: () => tasks };
}

let fetchState;

/** Renderiza o App esperando o primeiro carregamento terminar. */
async function renderApp() {
  let result;
  await act(async () => {
    result = render(<App />);
  });
  return result;
}

beforeEach(() => {
  fetchState = createFetchMock([]);
  global.fetch = fetchState.fetchMock;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Lista de tarefas', () => {
  it('mostra os contadores de total e concluídas', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Tarefa A', completed: 0 },
      { id: 2, title: 'Tarefa B', completed: 1 },
      { id: 3, title: 'Tarefa C', completed: 1 },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();

    expect(screen.getByText('Tarefa A')).toBeInTheDocument();
    expect(screen.getByText('Total').parentElement).toHaveTextContent('3');
    expect(screen.getByText('Concluídas').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Pendentes').parentElement).toHaveTextContent('1');
  });

  it('mostra o estado vazio com o texto do mockup', async () => {
    await renderApp();

    expect(screen.getByText('You have no pending tasks.')).toBeInTheDocument();
  });

  it('ordena as tarefas pela data mais próxima primeiro', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Sem prazo', completed: 0, due_date: null },
      { id: 2, title: 'Depois', completed: 0, due_date: shiftDays(10) },
      { id: 3, title: 'Logo', completed: 0, due_date: shiftDays(1) },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Logo');

    const titles = [...document.querySelectorAll('.task__title')].map((el) => el.textContent);
    expect(titles).toEqual(['Logo', 'Depois', 'Sem prazo']);
  });

  it('destaca tarefas em atraso com selo e título em vermelho', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Atrasada', completed: 0, due_date: shiftDays(-2) },
      { id: 2, title: 'No prazo', completed: 0, due_date: shiftDays(2) },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Atrasada');

    const atrasada = screen.getByText('Atrasada').closest('.task');
    expect(atrasada).toHaveClass('is-overdue');
    expect(within(atrasada).getByText('Em atraso')).toBeInTheDocument();
    // O título herda a cor vermelha definida em `.task.is-overdue .task__title`.
    expect(getComputedStyle(atrasada.querySelector('.task__title')).color).toContain('danger');

    const noPrazo = screen.getByText('No prazo').closest('.task');
    expect(noPrazo).not.toHaveClass('is-overdue');
    expect(within(noPrazo).queryByText('Em atraso')).not.toBeInTheDocument();
    expect(getComputedStyle(noPrazo.querySelector('.task__title')).color).not.toContain('danger');
  });

  it('não marca como atrasada uma tarefa concluída', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Concluída atrasada', completed: 1, due_date: shiftDays(-5) },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Concluída atrasada');

    const item = screen.getByText('Concluída atrasada').closest('.task');
    expect(item).not.toHaveClass('is-overdue');
    expect(within(item).queryByText('Em atraso')).not.toBeInTheDocument();
  });
});

describe('Busca com debounce', () => {
  it('só chama a API depois que o usuário para de digitar', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Estudar React', completed: 0 },
      { id: 2, title: 'Comprar café', completed: 0 },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Estudar React');

    const callsBefore = fetchState.calls.filter((call) => call.method === 'GET').length;

    vi.useFakeTimers();
    const input = screen.getByLabelText('Buscar tarefas');
    fireEvent.change(input, { target: { value: 'E' } });
    fireEvent.change(input, { target: { value: 'Es' } });
    fireEvent.change(input, { target: { value: 'Estu' } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const callsDuringTyping = fetchState.calls.filter((call) => call.method === 'GET').length;
    expect(callsDuringTyping).toBe(callsBefore);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const callsAfterDebounce = fetchState.calls.filter((call) => call.method === 'GET').length;
    expect(callsAfterDebounce).toBe(callsBefore + 1);
    expect(fetchState.calls.at(-1).url).toContain('search=Estu');
  });

  it('filtra a lista pelo termo buscado', async () => {
    fetchState = createFetchMock([
      { id: 1, title: 'Estudar React', completed: 0 },
      { id: 2, title: 'Comprar café', completed: 0 },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Estudar React');

    fireEvent.change(screen.getByLabelText('Buscar tarefas'), { target: { value: 'café' } });

    await waitFor(() => {
      expect(screen.queryByText('Estudar React')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Comprar café')).toBeInTheDocument();
  });
});

describe('Criar tarefa', () => {
  it('abre o modal "Create Task" pelo botão flutuante e envia a tarefa', async () => {
    await renderApp();

    fireEvent.click(screen.getByLabelText('Criar tarefa'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Create Task')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ex.: Estudar React'), {
      target: { value: 'Nova tarefa' },
    });
    fireEvent.change(document.querySelector('input[type="date"]'), {
      target: { value: shiftDays(3) },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      const post = fetchState.calls.find((call) => call.method === 'POST');
      expect(post).toBeDefined();
      expect(post.body.title).toBe('Nova tarefa');
      expect(post.body.dueDate).toBe(shiftDays(3));
    });

    expect(await screen.findByText('Nova tarefa')).toBeInTheDocument();
  });

  it('permite criar tarefa sem data limite', async () => {
    await renderApp();
    fireEvent.click(screen.getByLabelText('Criar tarefa'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(screen.getByPlaceholderText('Ex.: Estudar React'), {
      target: { value: 'Sem prazo' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      const post = fetchState.calls.find((call) => call.method === 'POST');
      expect(post.body.dueDate).toBeNull();
    });
  });

  it('exibe o estado vazio depois de excluir todas as tarefas', async () => {
    fetchState = createFetchMock([{ id: 1, title: 'Única', completed: 0 }]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Única');

    fireEvent.click(screen.getByLabelText('Excluir Única'));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText('You have no pending tasks.')).toBeInTheDocument();
  });
});

describe('Editar tarefa', () => {
  it('abre o modal "Edit Task" pelo botão de lápis e salva as alterações', async () => {
    fetchState = createFetchMock([
      { id: 7, title: 'Tarefa antiga', completed: 0, due_date: shiftDays(1) },
    ]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Tarefa antiga');

    fireEvent.click(screen.getByLabelText('Editar Tarefa antiga'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Edit Task')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Tarefa antiga'), {
      target: { value: 'Tarefa nova' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      const patch = fetchState.calls.find((call) => call.method === 'PATCH');
      expect(patch).toBeDefined();
      expect(patch.body.title).toBe('Tarefa nova');
      expect(patch.body.dueDate).toBe(shiftDays(1));
    });

    expect(await screen.findByText('Tarefa nova')).toBeInTheDocument();
  });
});

describe('Concluir e excluir', () => {
  it('marca e desmarca a tarefa como concluída pelo checkbox', async () => {
    fetchState = createFetchMock([{ id: 3, title: 'Alternar', completed: 0 }]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Alternar');

    fireEvent.click(screen.getByLabelText('Marcar como concluída'));

    await waitFor(() => {
      const patch = fetchState.calls.find((call) => call.method === 'PATCH');
      expect(patch.body.completed).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Marcar como pendente')).toBeChecked();
    });

    fireEvent.click(screen.getByLabelText('Marcar como pendente'));

    await waitFor(() => {
      const patches = fetchState.calls.filter((call) => call.method === 'PATCH');
      expect(patches.at(-1).body.completed).toBe(false);
    });
  });

  it('exclui a tarefa a partir do botão da lixeira', async () => {
    fetchState = createFetchMock([{ id: 9, title: 'Para excluir', completed: 0 }]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Para excluir');

    fireEvent.click(screen.getByLabelText('Excluir Para excluir'));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(fetchState.calls.some((call) => call.method === 'DELETE')).toBe(true);
    });

    expect(await screen.findByText('You have no pending tasks.')).toBeInTheDocument();
  });
});

describe('Tratamento de erro da API', () => {
  it('mostra na tela a mensagem de erro devolvida pela API', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ message: 'Banco de dados indisponível.' }),
    }));

    await renderApp();

    expect(await screen.findByText('Banco de dados indisponível.')).toBeInTheDocument();
  });

  it('avisa quando a API está fora do ar', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await renderApp();

    expect(await screen.findByText(/Não foi possível conectar à API/)).toBeInTheDocument();
  });
});

describe('Ações no hover', () => {
  it('esconde os botões de editar e excluir até o mouse passar pelo item', async () => {
    fetchState = createFetchMock([{ id: 1, title: 'Com hover', completed: 0 }]);
    global.fetch = fetchState.fetchMock;

    await renderApp();
    await screen.findByText('Com hover');

    const item = screen.getByText('Com hover').closest('.task');
    const actions = item.querySelector('.task__actions');

    expect(actions).toBeInTheDocument();
    expect(getComputedStyle(actions).opacity).toBe('0');
  });

  it('mostra o botão flutuante "+" no canto inferior direito', async () => {
    await renderApp();

    const fab = screen.getByLabelText('Criar tarefa');
    expect(fab).toHaveClass('fab');
    expect(getComputedStyle(fab).position).toBe('fixed');
  });
});
