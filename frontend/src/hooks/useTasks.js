import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  listTasks,
  updateTask as apiUpdateTask,
} from '../api/tasks';
import { useDebouncedValue } from './useDebouncedValue';
import { normalizeTask, sortTasks } from '../utils/tasks';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Centraliza o estado das tarefas: carregamento, busca com debounce,
 * contadores e as mutações (criar, editar, concluir, excluir).
 */
export function useTasks() {
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [loadedSearch, setLoadedSearch] = useState('');
  const [error, setError] = useState('');

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const requestIdRef = useRef(0);

  /** Aplica a resposta da API na tela (compartilhado por busca e mutações). */
  const applyResponse = useCallback((data, term) => {
    setTasks(sortTasks((data?.tasks ?? []).map(normalizeTask)));
    setCounts({ total: data?.total ?? 0, completed: data?.completed ?? 0 });
    setLoadedSearch(term);
    setError('');
  }, []);

  // Busca em tempo real: só dispara quando o usuário para de digitar (debounce).
  useEffect(() => {
    let active = true;
    const term = debouncedSearch.trim();

    const apply = (data) => {
      if (!active) return;
      applyResponse(data, term);
    };

    (async () => {
      const requestId = ++requestIdRef.current;
      try {
        const data = await listTasks({ search: term });
        if (requestId !== requestIdRef.current) return;
        apply(data);
      } catch (err) {
        if (!active || requestId !== requestIdRef.current) return;
        setError(err.message || 'Não foi possível carregar as tarefas.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applyResponse, debouncedSearch]);

  /** Recarrega a lista preservando o termo de busca atual. */
  const refresh = useCallback(async () => {
    const term = debouncedSearch.trim();
    const requestId = ++requestIdRef.current;

    try {
      const data = await listTasks({ search: term });
      if (requestId !== requestIdRef.current) return;
      applyResponse(data, term);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as tarefas.');
      throw err;
    }
  }, [applyResponse, debouncedSearch]);

  const createTask = useCallback(
    async (payload) => {
      await apiCreateTask(payload);
      await refresh();
    },
    [refresh],
  );

  const editTask = useCallback(
    async (id, changes) => {
      await apiUpdateTask(id, changes);
      await refresh();
    },
    [refresh],
  );

  const toggleTask = useCallback(async (id, completed) => {
    // Atualização otimista: o checkbox responde na hora, sem esperar a API.
    setTasks((prev) =>
      sortTasks(
        prev.map((task) => (task.id === id ? { ...task, completed } : task)),
      ),
    );
    setCounts((prev) => ({
      total: prev.total,
      completed: Math.max(0, prev.completed + (completed ? 1 : -1)),
    }));

    try {
      await apiUpdateTask(id, { completed });
    } catch (err) {
      // Reverte a mudança otimista.
      setTasks((prev) =>
        sortTasks(
          prev.map((task) =>
            task.id === id ? { ...task, completed: !completed } : task,
          ),
        ),
      );
      setCounts((prev) => ({
        total: prev.total,
        completed: Math.max(0, prev.completed + (completed ? -1 : 1)),
      }));
      setError(err.message || 'Não foi possível atualizar a tarefa.');
      throw err;
    }
  }, []);

  const removeTask = useCallback(
    async (id) => {
      const removed = tasks.find((task) => task.id === id);

      setTasks((prev) => prev.filter((task) => task.id !== id));
      setCounts((prev) => ({
        total: Math.max(0, prev.total - 1),
        completed: Math.max(0, prev.completed - (removed?.completed ? 1 : 0)),
      }));

      try {
        await apiDeleteTask(id);
      } catch (err) {
        setError(err.message || 'Não foi possível excluir a tarefa.');
        await refresh().catch(() => {});
        throw err;
      }
    },
    [refresh, tasks],
  );

  // A lista fica "esmaecida" enquanto a busca em andamento não retorna.
  const refreshing = search.trim() !== loadedSearch;

  return {
    tasks,
    counts,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    setError,
    refresh,
    createTask,
    editTask,
    toggleTask,
    removeTask,
  };
}
