import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useSedes from '../../hooks/useSedes';
import { Cargando, Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { fechaHora, pesos } from '../../utils/formato';

export default function Caja() {
  const toast = useToast();
  const { sedes } = useSedes();
  const [sedeId, setSedeId] = useState('');
  const [pendiente, setPendiente] = useState(null);
  const [cierres, setCierres] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (sedes.length && !sedeId) setSedeId(sedes[0]._id);
  }, [sedes, sedeId]);

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    setPendiente(null);
    setCierres(null);
    try {
      const [p, c] = await Promise.all([
        api.get('/caja/pendiente', { params: { parqueaderoId: sedeId } }),
        api.get('/caja/cierres', { params: { parqueaderoId: sedeId } }),
      ]);
      setPendiente(p.data);
      setCierres(c.data.cierres);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar la caja'));
    }
  }, [sedeId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cerrar() {
    if (!window.confirm(`Cerrar la caja por ${pesos(pendiente.totalIngresos)}?`)) return;
    setGuardando(true);
    try {
      await api.post('/caja/cierres', {
        parqueaderoId: sedeId,
        desde: pendiente.desde,
        hasta: pendiente.hasta,
        observaciones: observaciones.trim() || undefined,
      });
      toast.exito('Cierre de caja registrado');
      setObservaciones('');
      cargar();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo registrar el cierre'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <h1 className="p-titulo">Cierre de caja</h1>
      <p className="p-sub">Dinero acumulado desde el último cierre de la sede.</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !pendiente && <Cargando />}
        {pendiente && (
          <>
            <div className="p-kpis">
              <div className="p-kpi"><span>Por cerrar</span><strong>{pesos(pendiente.totalIngresos)}</strong></div>
              <div className="p-kpi"><span>Facturas</span><strong>{pendiente.cantidadFacturas}</strong></div>
            </div>
            <p className="p-sub">Periodo: {fechaHora(pendiente.desde)} → {fechaHora(pendiente.hasta)}</p>
            <label className="p-campo">Observaciones (opcional)
              <textarea rows={2} maxLength={300} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </label>
            <p>
              <button type="button" className="p-boton" onClick={cerrar} disabled={guardando || pendiente.cantidadFacturas === 0}>
                {guardando ? 'Cerrando...' : 'Cerrar caja'}
              </button>
            </p>
          </>
        )}
      </div>

      <div className="p-tarjeta">
        <h2>Cierres anteriores</h2>
        {!cierres && !error && <Esqueleto />}
        {cierres && cierres.length === 0 && <Vacio icono="🧾" titulo="Aún no hay cierres en esta sede" />}
        {cierres && cierres.length > 0 && (
          <div className="p-tabla-envoltura">
            <table className="p-tabla p-tabla-tarjetas">
              <thead><tr><th>Periodo</th><th>Facturas</th><th>Total</th><th>Observaciones</th></tr></thead>
              <tbody>
                {cierres.map((c) => (
                  <tr key={c._id}>
                    <td data-etiqueta="Periodo">{fechaHora(c.desde)} → {fechaHora(c.hasta)}</td>
                    <td data-etiqueta="Facturas">{c.cantidadFacturas}</td>
                    <td data-etiqueta="Total">{pesos(c.totalIngresos)}</td>
                    <td data-etiqueta="Observaciones">{c.observaciones || '—'}</td>
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
