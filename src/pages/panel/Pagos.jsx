import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import useSedes from '../../hooks/useSedes';
import { Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { fechaHora, pesos } from '../../utils/formato';

export default function Pagos() {
  const { sedes } = useSedes();
  const [filtros, setFiltros] = useState({ parqueaderoId: '', desde: '', hasta: '' });
  const [pagos, setPagos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get('/pagos', { params });
      setPagos(data.pagos);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los pagos'));
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  const total = (pagos || []).reduce((s, p) => s + p.monto, 0);

  return (
    <>
      <h1 className="p-titulo">Pagos</h1>
      <p className="p-sub">Pagos confirmados de facturas y reservas.</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={filtros.parqueaderoId} onChange={(e) => setFiltros((f) => ({ ...f, parqueaderoId: e.target.value }))}>
              <option value="">Todas</option>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="p-campo">Desde
            <input type="date" value={filtros.desde} onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))} />
          </label>
          <label className="p-campo">Hasta
            <input type="date" value={filtros.hasta} onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))} />
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !pagos && <Esqueleto filas={4} />}
        {pagos && pagos.length === 0 && <Vacio icono="💳" titulo="No hay pagos" texto="Los pagos registrados aparecerán aquí." />}
        {pagos && pagos.length > 0 && (
          <>
            <p className="p-sub">{pagos.length} pagos · Total <strong>{pesos(total)}</strong></p>
            <div className="p-tabla-envoltura">
              <table className="p-tabla p-tabla-tarjetas">
                <thead><tr><th>Fecha</th><th>Placa</th><th>Concepto</th><th>Método</th><th>Monto</th><th>Estado</th></tr></thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p._id}>
                      <td data-etiqueta="Fecha">{fechaHora(p.createdAt)}</td>
                      <td data-etiqueta="Placa"><strong>{p.placa || '—'}</strong></td>
                      <td data-etiqueta="Concepto">{p.concepto || '—'}</td>
                      <td data-etiqueta="Método">{p.metodo}</td>
                      <td data-etiqueta="Monto">{pesos(p.monto)}</td>
                      <td data-etiqueta="Estado"><span className={`p-etiqueta ${p.estado === 'confirmado' ? 'verde' : 'ambar'}`}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
