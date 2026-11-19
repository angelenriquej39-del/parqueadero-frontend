import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useSedes from '../../hooks/useSedes';
import { Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { fechaHora, paraInputFecha, pesos, TIPOS_VEHICULO } from '../../utils/formato';

const ESTADO_COLOR = { activa: 'verde', vencida: 'roja', cancelada: 'gris', cumplida: 'ambar' };

export default function Reservas() {
  const { usuario } = useAuth();
  const toast = useToast();
  const esStaff = usuario?.rol === 'admin' || usuario?.rol === 'operador';
  const { sedes } = useSedes();

  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');
  const [soloMias, setSoloMias] = useState(!esStaff);
  const [estado, setEstado] = useState('');

  const [sedeId, setSedeId] = useState('');
  const [puestos, setPuestos] = useState([]);
  const [puestoId, setPuestoId] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('carro');
  const [inicio, setInicio] = useState(() => paraInputFecha(new Date(Date.now() + 10 * 60000)));
  const [fin, setFin] = useState(() => paraInputFecha(new Date(Date.now() + 70 * 60000)));
  const [estimado, setEstimado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const params = {};
      if (soloMias) params.mias = true;
      if (estado) params.estado = estado;
      const { data } = await api.get('/reservas', { params });
      setReservas(data.reservas);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las reservas'));
    }
  }, [soloMias, estado]);

  useEffect(() => { cargar(); }, [cargar]);

  // La lista se refresca sola cuando llega una notificacion (ej. reserva vencida).
  useEffect(() => {
    socket.on('notificacion', cargar);
    return () => socket.off('notificacion', cargar);
  }, [cargar]);

  useEffect(() => {
    if (sedes.length && !sedeId) setSedeId(sedes[0]._id);
  }, [sedes, sedeId]);

  // Puestos libres de la sede elegida.
  useEffect(() => {
    if (!sedeId) return;
    let activo = true;
    api.get('/puestos', { params: { parqueaderoId: sedeId, estado: 'libre' } })
      .then(({ data }) => {
        if (!activo) return;
        setPuestos(data.puestos);
        setPuestoId(data.puestos[0]?._id || '');
      })
      .catch((err) => toast.error(mensajeError(err, 'No se pudieron cargar los puestos')));
    return () => { activo = false; };
  }, [sedeId, toast]);

  // Cobro estimado segun la tarifa de la sede.
  useEffect(() => {
    const minutos = Math.round((new Date(fin) - new Date(inicio)) / 60000);
    if (!sedeId || !(minutos > 0)) { setEstimado(null); return; }
    let activo = true;
    api.get('/tarifas/estimar', { params: { parqueaderoId: sedeId, tipoVehiculo, minutos } })
      .then(({ data }) => { if (activo) setEstimado(data.valor); })
      .catch(() => { if (activo) setEstimado(null); });
    return () => { activo = false; };
  }, [sedeId, tipoVehiculo, inicio, fin]);

  async function crear(e) {
    e.preventDefault();
    if (!puestoId) { toast.error('No hay puestos libres en esta sede'); return; }
    setGuardando(true);
    try {
      await api.post('/reservas', {
        puestoId,
        placa: placa.trim().toUpperCase(),
        tipoVehiculo,
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
      });
      toast.exito('Reserva creada correctamente');
      setPlaca('');
      cargar();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo crear la reserva'));
    } finally {
      setGuardando(false);
    }
  }

  async function cancelar(r) {
    if (!window.confirm(`Cancelar la reserva de ${r.placa}?`)) return;
    try {
      await api.put(`/reservas/${r._id}/cancelar`);
      toast.exito('Reserva cancelada');
      cargar();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo cancelar'));
    }
  }

  async function pagar(r) {
    try {
      await api.post('/pagos', { reservaId: r._id, metodo: 'efectivo' });
      toast.exito('Pago registrado');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo registrar el pago'));
    }
  }

  return (
    <>
      <h1 className="p-titulo">Reservas</h1>
      <p className="p-sub">Reserva un puesto libre; si no llegas a tiempo la reserva vence y el puesto se libera solo.</p>

      <form className="p-tarjeta" onSubmit={crear}>
        <h2>Nueva reserva</h2>
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} required>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="p-campo">Puesto libre
            <select value={puestoId} onChange={(e) => setPuestoId(e.target.value)} required>
              {puestos.length === 0 && <option value="">Sin puestos libres</option>}
              {puestos.map((p) => <option key={p._id} value={p._id}>#{p.numero} · {p.nivel}</option>)}
            </select>
          </label>
          <label className="p-campo">Placa
            <input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} required />
          </label>
          <label className="p-campo">Vehiculo
            <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)}>
              {TIPOS_VEHICULO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="p-campo">Inicio
            <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
          </label>
          <label className="p-campo">Fin
            <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} required />
          </label>
        </div>
        <p className="p-sub" aria-live="polite">
          Cobro estimado: <strong>{estimado == null ? '—' : pesos(estimado)}</strong>
        </p>
        <button className="p-boton" disabled={guardando || !puestoId}>{guardando ? 'Reservando...' : 'Reservar'}</button>
      </form>

      <div className="p-tarjeta">
        <h2>{soloMias ? 'Mis reservas' : 'Todas las reservas'}</h2>
        <div className="p-filtros">
          {esStaff && (
            <label className="p-campo">Ver
              <select value={soloMias ? 'mias' : 'todas'} onChange={(e) => setSoloMias(e.target.value === 'mias')}>
                <option value="todas">Todas</option>
                <option value="mias">Solo las mias</option>
              </select>
            </label>
          )}
          <label className="p-campo">Estado
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="activa">Activas</option>
              <option value="vencida">Vencidas</option>
              <option value="cancelada">Canceladas</option>
              <option value="cumplida">Cumplidas</option>
            </select>
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !reservas && <Esqueleto />}
        {reservas && reservas.length === 0 && <Vacio icono="🅿️" titulo="No hay reservas" texto="Cuando crees una aparecerá aquí." />}
        {reservas && reservas.length > 0 && (
          <div className="p-tabla-envoltura">
            <table className="p-tabla p-tabla-tarjetas">
              <thead>
                <tr><th>Placa</th><th>Puesto</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r._id}>
                    <td data-etiqueta="Placa"><strong>{r.placa}</strong></td>
                    <td data-etiqueta="Puesto">#{r.puesto?.numero} · {r.puesto?.nivel}</td>
                    <td data-etiqueta="Inicio">{fechaHora(r.inicio)}</td>
                    <td data-etiqueta="Fin">{fechaHora(r.fin)}</td>
                    <td data-etiqueta="Estado"><span className={`p-etiqueta ${ESTADO_COLOR[r.estado] || ''}`}>{r.estado}</span></td>
                    <td data-etiqueta="Acciones">
                      {r.estado === 'activa' && (
                        <>
                          <button type="button" className="p-boton p-boton-chico p-boton-sec" onClick={() => pagar(r)}>Pagar</button>{' '}
                          <button type="button" className="p-boton p-boton-chico p-boton-peligro" onClick={() => cancelar(r)}>Cancelar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
