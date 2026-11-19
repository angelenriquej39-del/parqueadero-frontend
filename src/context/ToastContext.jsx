import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './ToastContext.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);

  const quitar = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback((tipo, texto) => {
    const id = ++contador.current;
    setToasts((lista) => [...lista.slice(-3), { id, tipo, texto }]);
    setTimeout(() => quitar(id), 5000);
  }, [quitar]);

  const toast = useMemo(() => ({
    exito: (texto) => mostrar('exito', texto),
    error: (texto) => mostrar('error', texto),
    info: (texto) => mostrar('info', texto),
  }), [mostrar]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-contenedor" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            <span>{t.texto}</span>
            <button type="button" onClick={() => quitar(t.id)} aria-label="Cerrar aviso">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
