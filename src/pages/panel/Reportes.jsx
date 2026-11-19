import { useState } from 'react';
import { descargarArchivo, mensajeError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useSedes from '../../hooks/useSedes';

export default function Reportes() {
  const { usuario } = useAuth();
  const toast = useToast();
  const { sedes } = useSedes();
  const [parqueaderoId, setParqueaderoId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [descargando, setDescargando] = useState('');

  const reportes = [
    { clave: 'ingresos', ruta: '/reportes/ingresos', titulo: 'Ingresos', texto: 'Facturas cobradas en el periodo.', usaFechas: true },
    { clave: 'ocupacion', ruta: '/reportes/ocupacion', titulo: 'Ocupación actual', texto: 'Puestos libres, ocupados y reservados por sede.', usaFechas: false },
    ...(usuario?.rol === 'admin'
      ? [{ clave: 'auditoria', ruta: '/reportes/auditoria', titulo: 'Auditoría', texto: 'Acciones realizadas en el sistema.', usaFechas: true }]
      : []),
  ];

  async function descargar(r, formato) {
    const llave = `${r.clave}-${formato}`;
    setDescargando(llave);
    try {
      const params = { formato };
      if (parqueaderoId) params.parqueaderoId = parqueaderoId;
      if (r.usaFechas && desde) params.desde = desde;
      if (r.usaFechas && hasta) params.hasta = hasta;
      await descargarArchivo(r.ruta, params, `${r.clave}.${formato}`);
      toast.exito(`Reporte de ${r.titulo.toLowerCase()} descargado`);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo generar el reporte'));
    } finally {
      setDescargando('');
    }
  }

  return (
    <>
      <h1 className="p-titulo">Reportes</h1>
      <p className="p-sub">Descarga los reportes en Excel o PDF.</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={parqueaderoId} onChange={(e) => setParqueaderoId(e.target.value)}>
              <option value="">Todas</option>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="p-campo">Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="p-campo">Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>
        <p className="p-sub">Si no eliges fechas, los reportes con periodo usan los últimos 30 días.</p>
      </div>

      <div className="p-dos">
        {reportes.map((r) => (
          <div key={r.clave} className="p-tarjeta">
            <h2>{r.titulo}</h2>
            <p className="p-sub">{r.texto}</p>
            <button type="button" className="p-boton" disabled={!!descargando} onClick={() => descargar(r, 'xlsx')}>
              {descargando === `${r.clave}-xlsx` ? 'Generando...' : 'Excel (.xlsx)'}
            </button>{' '}
            <button type="button" className="p-boton p-boton-sec" disabled={!!descargando} onClick={() => descargar(r, 'pdf')}>
              {descargando === `${r.clave}-pdf` ? 'Generando...' : 'PDF'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
