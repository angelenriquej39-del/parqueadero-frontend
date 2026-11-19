export const pesos = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`;

export const fechaHora = (f) => (f
  ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota' })
  : '—');

export function duracion(minutos) {
  if (minutos == null) return '—';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

// Valor para <input type="datetime-local"> en hora local del navegador.
export function paraInputFecha(fecha) {
  const d = new Date(fecha);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export const TIPOS_VEHICULO = ['carro', 'moto', 'bicicleta'];
