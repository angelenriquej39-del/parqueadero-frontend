import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import useSedes from '../../hooks/useSedes';
import { Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { fechaHora } from '../../utils/formato';

export default function Auditoria() {
  const { sedes } = useSedes();
  const [filtros, setFiltros] = useState({ parqueaderoId: '', accion: '', desde: '', hasta: '' });
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = { page: pagina, limit: 30 };
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v.trim ? v.trim() : v; });
      const { data } = await api.get('/auditoria', { params });
      setDatos(data);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar la auditoría'));
    }
  }, [filtros, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  function cambiar(campo, valor) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <>
      <h1 className="p-titulo">Auditoría</h1>
      <p className="p-sub">Registro de las acciones realizadas en el sistema (solo administrador).</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={filtros.parqueaderoId} onChange={(e) => cambiar('parqueaderoId', e.target.value)}>
              <option value="">Todas</option>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="p-campo">Accion
            <input value={filtros.accion} onChange={(e) => cambiar('accion', e.target.value)} placeholder="ej. entrada" />
          </label>
          <label className="p-campo">Desde
            <input type="date" value={filtros.desde} onChange={(e) => cambiar('desde', e.target.value)} />
          </label>
          <label className="p-campo">Hasta
            <input type="date" value={filtros.hasta} onChange={(e) => cambiar('hasta', e.target.value)} />
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !datos && <Esqueleto filas={6} />}
        {datos && datos.eventos.length === 0 && <Vacio icono="🗂️" titulo="Sin eventos" texto="Prueba con otros filtros." />}
        {datos && datos.eventos.length > 0 && (
          <>
            <div className="p-tabla-envoltura">
              <table className="p-tabla p-tabla-tarjetas">
                <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
                <tbody>
                  {datos.eventos.map((e) => (
                    <tr key={e._id}>
                      <td data-etiqueta="Fecha">{fechaHora(e.createdAt)}</td>
                      <td data-etiqueta="Usuario">{e.usuario?.nombre || 'Sistema'}</td>
                      <td data-etiqueta="Acción"><span className="p-etiqueta">{e.accion}</span></td>
                      <td data-etiqueta="Detalle" style={{ whiteSpace: 'normal' }}>{e.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-paginacion">
              <button type="button" className="p-boton p-boton-sec p-boton-chico" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
              <span>Pagina {datos.page} de {datos.paginas} · {datos.total} eventos</span>
              <button type="button" className="p-boton p-boton-sec p-boton-chico" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
