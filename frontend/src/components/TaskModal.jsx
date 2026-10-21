import { useEffect, useRef, useState } from 'react';
import { IconClose } from './icons';

/**
 * Modal usado tanto para criar ("Create Task") quanto para editar ("Edit Task").
 */
export default function TaskModal({ mode, task, onClose, onSubmit }) {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(task?.title ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Informe o nome da tarefa.');
      titleRef.current?.focus();
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSubmit({ title: title.trim(), dueDate: dueDate || null });
      onClose();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a tarefa.');
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {isEdit ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <IconClose />
          </button>
        </header>

        <form className="modal__form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Tarefa</span>
            <input
              ref={titleRef}
              className="field__input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Estudar React"
              maxLength={255}
              disabled={saving}
            />
          </label>

          <label className="field">
            <span className="field__label">
              Data limite <em>(opcional)</em>
            </span>
            <input
              className="field__input"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={saving}
            />
          </label>

          {error && <p className="modal__error">{error}</p>}

          <footer className="modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
