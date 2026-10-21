import { useEffect } from 'react';
import { IconAlert } from './icons';

export default function ConfirmDialog({ task, onCancel, onConfirm, busy }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, busy]);

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className="modal__confirm-icon">
          <IconAlert />
        </span>
        <h2 id="confirm-title" className="modal__title modal__title--center">
          Excluir tarefa?
        </h2>
        <p className="modal__confirm-text">
          “{task.title}” será removida permanentemente.
        </p>
        <footer className="modal__footer modal__footer--center">
          <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Excluindo...' : 'Excluir'}
          </button>
        </footer>
      </div>
    </div>
  );
}
