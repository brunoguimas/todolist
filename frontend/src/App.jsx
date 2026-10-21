import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import Fab from './components/Fab';
import SearchBar from './components/SearchBar';
import StatsBar from './components/StatsBar';
import TaskItem from './components/TaskItem';
import TaskModal from './components/TaskModal';
import { IconAlert, IconCheck } from './components/icons';

export default function App() {
  const {
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
  } = useTasks();

  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', task }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function handleToggle(id, completed) {
    setBusyId(id);
    try {
      await toggleTask(id, completed);
    } catch {
      /* o hook já exibe o erro */
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await removeTask(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      /* o hook já exibe o erro */
    } finally {
      setBusyId(null);
    }
  }

  const isFiltered = search.trim().length > 0;

  return (
    <div className="app">
      <div className="app__background" aria-hidden="true" />

      <main className="container">
        <header className="header">
          <div className="header__brand">
            <span className="header__logo">
              <IconCheck />
            </span>
            <div>
              <h1 className="header__title">Minhas Tarefas</h1>
              <p className="header__subtitle">Organize o seu dia, uma tarefa por vez.</p>
            </div>
          </div>
        </header>

        <StatsBar total={counts.total} completed={counts.completed} />

        <SearchBar value={search} onChange={setSearch} resultCount={tasks.length} />

        {error && (
          <div className="alert" role="alert">
            <IconAlert className="alert__icon" />
            <span className="alert__text">{error}</span>
            <button
              type="button"
              className="alert__action"
              onClick={() => refresh().catch(() => {})}
            >
              Tentar novamente
            </button>
            <button type="button" className="alert__close" onClick={() => setError('')} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}

        <section className={`tasks${refreshing ? ' is-refreshing' : ''}`} aria-label="Lista de tarefas">
          {loading ? (
            <ul className="task-list">
              {[0, 1, 2].map((index) => (
                <li key={index} className="task task--skeleton">
                  <span className="skeleton skeleton--box" />
                  <span className="skeleton skeleton--line" />
                </li>
              ))}
            </ul>
          ) : tasks.length === 0 ? (
            <EmptyState isFiltered={isFiltered} onCreate={() => setModal({ mode: 'create' })} />
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  busy={busyId === task.id}
                  onToggle={handleToggle}
                  onEdit={(selected) => setModal({ mode: 'edit', task: selected })}
                  onDelete={(selected) => setPendingDelete(selected)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Fab onClick={() => setModal({ mode: 'create' })} />

      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.mode === 'edit') await editTask(modal.task.id, payload);
            else await createTask(payload);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          task={pendingDelete}
          busy={busyId === pendingDelete.id}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
