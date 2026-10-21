import { IconSearch } from './icons';

export default function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="search">
      <IconSearch className="search__icon" />
      <input
        className="search__input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar tarefas..."
        aria-label="Buscar tarefas"
      />
      {value && (
        <span className="search__count">
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </span>
      )}
    </div>
  );
}
