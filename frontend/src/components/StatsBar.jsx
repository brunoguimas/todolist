import { IconList } from './icons';

export default function StatsBar({ total, completed }) {
  const pending = Math.max(0, total - completed);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="stats" aria-label="Resumo das tarefas">
      <div className="stat">
        <span className="stat__icon stat__icon--total">
          <IconList />
        </span>
        <div className="stat__info">
          <span className="stat__value">{total}</span>
          <span className="stat__label">Total</span>
        </div>
      </div>

      <div className="stat">
        <span className="stat__icon stat__icon--done">✓</span>
        <div className="stat__info">
          <span className="stat__value">{completed}</span>
          <span className="stat__label">Concluídas</span>
        </div>
      </div>

      <div className="stat">
        <span className="stat__icon stat__icon--pending">•</span>
        <div className="stat__info">
          <span className="stat__value">{pending}</span>
          <span className="stat__label">Pendentes</span>
        </div>
      </div>

      <div className="progress" title={`${percent}% concluído`}>
        <div className="progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
