import { useEffect, useState } from 'react';

/**
 * Retorna o valor depois que ele fica `delay` ms sem mudar.
 * Usado para disparar a busca na API apenas quando o usuário para de digitar.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
