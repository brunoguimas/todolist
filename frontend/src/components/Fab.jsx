import { IconPlus } from './icons';

/** Botão flutuante "+" no canto inferior direito. */
export default function Fab({ onClick }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label="Criar tarefa" title="Criar tarefa">
      <IconPlus />
    </button>
  );
}
