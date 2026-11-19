import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import socket from '../../services/socket';
import useSedes from '../../hooks/useSedes';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import './Puestos.css';

const ETIQUETA = { libre: 'Libre', ocupado: 'Ocupado', reservado: 'Reservado' };

// Grilla de puestos por sede, en tiempo real. El color NO es lo unico que
// distingue el estado: cada celda tambien lleva el texto (accesibilidad).
export default function Puestos() {
  const { sedes } = useSedes();
  const [sedeId, setSedeId] = useState('');
  const [puestos, setPuestos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sedes.length && !sedeId) setSedeId(sedes[0]._id);
  }, [sedes, sedeId]);

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    setPuestos(null);
    try {
      const { data } = await api.get('/puestos', { params: { parqueaderoId: sedeId } });
      setPuestos(data.puestos);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los puestos'));
    }
  }, [sedeId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    function alCambiar(actualizado) {
      setPuestos((actuales) => (actuales
        ? actuales.map((p) => (p._id === actualizado._id ? { ...p, ...actualizado } : p))
        : actuales));
    }
    socket.on('puesto_actualizado', alCambiar);
    return () => socket.off('puesto_actualizado', alCambiar);
  }, []);

  const conteo = (estado) => (puestos || []).filter((p) => p.estado === estado).length;
  const niveles = [...new Set((puestos || []).map((p) => p.nivel))];

  return (
    <>
      <h1 className="p-titulo">Puestos</h1>
      <p className="p-sub">Estado de cada puesto en tiempo real.</p>

      <div className="p-tarjeta">
        <div className="p-filtros">
          <label className="p-campo">Sede
            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
              {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </select>
          </label>
        </div>

        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !puestos && <Cargando texto="Cargando puestos..." />}
        {puestos && puestos.length === 0 && <Vacio icono="🅿️" titulo="Esta sede no tiene puestos" />}
        {puestos && puestos.length > 0 && (
          <>
            <div className="p-puestos-resumen" aria-live="polite">
              <span className="p-puesto libre">{conteo('libre')} libres</span>
              <span className="p-puesto ocupado">{conteo('ocupado')} ocupados</span>
              <span className="p-puesto reservado">{conteo('reservado')} reservados</span>
            </div>
            {niveles.map((nivel) => (
              <section key={nivel} aria-label={nivel}>
                <h2>{nivel}</h2>
                <ul className="p-puestos-grilla">
                  {puestos.filter((p) => p.nivel === nivel).map((p) => (
                    <li key={p._id} className={`p-puesto ${p.estado}`} title={`Puesto ${p.numero}: ${ETIQUETA[p.estado]}`}>
                      <strong>{p.numero}</strong>
                      <small>{ETIQUETA[p.estado]}</small>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  );
}
