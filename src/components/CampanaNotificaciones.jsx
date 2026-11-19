import { useCallback, useEffect, useRef, useState } from 'react';
import api, { mensajeError } from '../services/api';
import socket from '../services/socket';
import { useToast } from '../context/ToastContext';
import './CampanaNotificaciones.css';

const ICONOS = {
  reserva_por_vencer: '⏳',
  reserva_vencida: '⌛',
  pago_confirmado: '✅',
  ocupacion_alta: '🚗',
};

function hace(fecha) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} d`;
}

// Campana con contador. Se actualiza en tiempo real con el evento
// 'notificacion' de Socket.io (sala privada del usuario).
export default function CampanaNotificaciones() {
  const toast = useToast();
  const [abierta, setAbierta] = useState(false);
  const [lista, setLista] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const contenedor = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones');
      setLista(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudieron cargar las notificaciones'));
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    function alLlegar(nueva) {
      setLista((actual) => [nueva, ...actual].slice(0, 50));
      setNoLeidas((n) => n + 1);
      toast.info(nueva.titulo);
    }
    socket.on('notificacion', alLlegar);
    return () => socket.off('notificacion', alLlegar);
  }, [toast]);

  useEffect(() => {
    function alHacerClicFuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierta(false);
    }
    function alTeclear(e) { if (e.key === 'Escape') setAbierta(false); }
    document.addEventListener('mousedown', alHacerClicFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, []);

  async function marcarLeida(n) {
    if (n.leida) return;
    try {
      await api.put(`/notificaciones/${n._id}/leida`);
      setLista((actual) => actual.map((x) => (x._id === n._id ? { ...x, leida: true } : x)));
      setNoLeidas((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(mensajeError(err));
    }
  }

  async function marcarTodas() {
    try {
      await api.put('/notificaciones/leer-todas');
      setLista((actual) => actual.map((x) => ({ ...x, leida: true })));
      setNoLeidas(0);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  }

  return (
    <div className="campana" ref={contenedor}>
      <button
        type="button"
        className="campana-boton"
        onClick={() => setAbierta((v) => !v)}
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ''}`}
        aria-expanded={abierta}
      >
        <span aria-hidden="true">🔔</span>
        {noLeidas > 0 && <span className="campana-contador">{noLeidas > 99 ? '99+' : noLeidas}</span>}
      </button>

      {abierta && (
        <div className="campana-panel" role="dialog" aria-label="Notificaciones">
          <div className="campana-cabecera">
            <strong>Notificaciones</strong>
            {noLeidas > 0 && <button type="button" onClick={marcarTodas}>Marcar todas como leídas</button>}
          </div>
          {cargando && <p className="campana-vacio">Cargando...</p>}
          {!cargando && lista.length === 0 && <p className="campana-vacio">No tienes notificaciones.</p>}
          <ul>
            {lista.map((n) => (
              <li key={n._id}>
                <button type="button" className={`campana-item ${n.leida ? '' : 'nueva'}`} onClick={() => marcarLeida(n)}>
                  <span aria-hidden="true">{ICONOS[n.tipo] || '🔔'}</span>
                  <span className="campana-texto">
                    <strong>{n.titulo}</strong>
                    <span>{n.mensaje}</span>
                    <small>{hace(n.createdAt)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
