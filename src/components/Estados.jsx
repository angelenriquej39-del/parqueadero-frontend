import './Estados.css';

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="estado estado-cargando" role="status" aria-live="polite">
      <span className="estado-spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

export function Esqueleto({ filas = 3 }) {
  return (
    <div className="esqueleto" aria-hidden="true">
      {Array.from({ length: filas }).map((_, i) => <div key={i} className="esqueleto-fila" />)}
    </div>
  );
}

export function Vacio({ icono = '📭', titulo, texto }) {
  return (
    <div className="estado estado-vacio">
      <span className="estado-icono" aria-hidden="true">{icono}</span>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
    </div>
  );
}

export function ErrorCarga({ mensaje, onReintentar }) {
  return (
    <div className="estado estado-error" role="alert">
      <span className="estado-icono" aria-hidden="true">⚠️</span>
      <strong>{mensaje || 'No se pudo cargar la información'}</strong>
      {onReintentar && <button type="button" className="p-boton" onClick={onReintentar}>Reintentar</button>}
    </div>
  );
}
