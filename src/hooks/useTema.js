import { useCallback, useState } from 'react';

const CLAVE = 'tema';

export function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'oscuro' || guardado === 'claro') return guardado;
  } catch {
    // localStorage no disponible
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

export function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
}

// Modo oscuro con preferencia guardada en localStorage.
export default function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || temaInicial());

  const alternar = useCallback(() => {
    setTema((actual) => {
      const siguiente = actual === 'oscuro' ? 'claro' : 'oscuro';
      aplicarTema(siguiente);
      try { localStorage.setItem(CLAVE, siguiente); } catch { /* sin storage */ }
      return siguiente;
    });
  }, []);

  return { tema, alternar };
}
