import { IconCheck } from './icons';

/**
 * Checkbox customizado com gradiente.
 * Mantém um input real (acessibilidade + formulário) escondido atrás da caixa.
 */
export default function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`checkbox${checked ? ' is-checked' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <span className="checkbox__box" aria-hidden="true">
        <IconCheck className="checkbox__check" />
      </span>
    </label>
  );
}
