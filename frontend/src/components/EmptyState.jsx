import { IconList, IconPlus } from './icons';

export default function EmptyState({ isFiltered, onCreate }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <IconList />
      </span>
      <p className="empty-state__text">You have no pending tasks.</p>
      {isFiltered ? (
        <p className="empty-state__hint">Tente buscar por outro termo.</p>
      ) : (
        <button type="button" className="button button--primary" onClick={onCreate}>
          <IconPlus />
          Criar primeira tarefa
        </button>
      )}
    </div>
  );
}
