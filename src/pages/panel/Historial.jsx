import { useCallback, useEffect, useState } from 'react';
import api, { descargarArchivo, mensajeError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useSedes from '../../hooks/useSedes';
import { Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { duracion, fechaHora, pesos } from '../../utils/formato';

export default function Historial() {
  const { usuario } = useAuth();
  const toast = useToast();
  const esStaff = usuario?.rol === 'admin' || usuario?.rol === 'operador';
  const { sedes } = useSedes();

  const [filtros, setFiltros] = useState({ placa: '', parqueaderoId: '', desde: '', hasta: '', estado: '' });
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { page: pagina, limit: 15 };
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = k === 'placa' ? v.trim().toUpperCase() : v; });
      const { data } = await api.get('/registros/historial', { params });
      setDatos(data);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el historial'));
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  function cambiar(campo, valor) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  async function comprobante(r) {
    try {
      await descargarArchivo(`/registros/${r._id}/comprobante`, undefined, `comprobante-${r.placa}.pdf`);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo descargar el comprobante'));
    }
  }

  async function pagar(r) {
    try {
      await api.post('/pagos', { facturaId: r.facturaId, metodo: 'efectivo' });
      toast.exito(`Pago de ${r.placa} registrado`);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo registrar el pago'));
    }
  }

  return (
    <>
      <h1 className="p-titulo">Historial</h1>
      <p className="p-sub">{esStaff ? 'Entradas y salidas por placa, sede y fecha.' : 'Tus entradas y salidas.'}</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Placa
            <input value={filtros.placa} onChange={(e) => cambiar('placa', e.target.value.toUpperCase())} placeholder="ABC123" maxLength={7} />
          </label>
          <label className="p-campo">Sede
            <select value={filtros.parqueaderoId} onChange={(e) => cambiar('parqueaderoId', e.target.value)}>
              <option value="">Todas</option>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="p-campo">Desde
            <input type="date" value={filtros.desde} onChange={(e) => cambiar('desde', e.target.value)} />
          </label>
          <label className="p-campo">Hasta
            <input type="date" value={filtros.hasta} onChange={(e) => cambiar('hasta', e.target.value)} />
          </label>
          <label className="p-campo">Estado
            <select value={filtros.estado} onChange={(e) => cambiar('estado', e.target.value)}>
              <option value="">Todos</option>
              <option value="activo">Dentro</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !datos && <Esqueleto filas={5} />}
        {datos && datos.registros.length === 0 && (
          <Vacio icono="🔎" titulo="Sin resultados" texto="Prueba con otros filtros." />
        )}
        {datos && datos.registros.length > 0 && (
          <>
            <div className="p-tabla-envoltura" style={{ opacity: cargando ? 0.6 : 1 }}>
              <table className="p-tabla p-tabla-tarjetas">
                <thead>
                  <tr><th>Placa</th><th>Sede</th><th>Puesto</th><th>Entrada</th><th>Salida</th><th>Tiempo</th><th>Cobro</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {datos.registros.map((r) => (
                    <tr key={r._id}>
                      <td data-etiqueta="Placa"><strong>{r.placa}</strong></td>
                      <td data-etiqueta="Sede">{r.parqueadero}</td>
                      <td data-etiqueta="Puesto">{r.puesto ? `#${r.puesto.numero}` : '—'}</td>
                      <td data-etiqueta="Entrada">{fechaHora(r.horaEntrada)}</td>
                      <td data-etiqueta="Salida">{r.estado === 'activo' ? <span className="p-etiqueta verde">Dentro</span> : fechaHora(r.horaSalida)}</td>
                      <td data-etiqueta="Tiempo">{duracion(r.minutos)}</td>
                      <td data-etiqueta="Cobro">{r.valorCobrado == null ? '—' : pesos(r.valorCobrado)}</td>
                      <td data-etiqueta="Acciones">
                        <button type="button" className="p-boton p-boton-chico p-boton-sec" onClick={() => comprobante(r)}>PDF</button>
                        {r.facturaId && (
                          <>{' '}<button type="button" className="p-boton p-boton-chico" onClick={() => pagar(r)}>Pagar</button></>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-paginacion">
              <button type="button" className="p-boton p-boton-sec p-boton-chico" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
              <span>Pagina {datos.page} de {datos.paginas} · {datos.total} registros</span>
              <button type="button" className="p-boton p-boton-sec p-boton-chico" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
