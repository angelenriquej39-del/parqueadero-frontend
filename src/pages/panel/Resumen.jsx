import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { pesos, fechaHora } from '../../utils/formato';
import { GraficaHoras, GraficaIngresos } from '../../components/Graficas';

function nivel(porcentaje) {
  if (porcentaje >= 85) return 'alta';
  if (porcentaje >= 60) return 'media';
  return '';
}

function VistaStaff() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/reportes/estadisticas');
      setDatos(data);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las estadísticas'));
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Ocupacion en vivo: al cambiar un puesto, refrescamos (agrupando cambios).
  useEffect(() => {
    let temporizador;
    function alCambiar() {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 600);
    }
    socket.on('puesto_actualizado', alCambiar);
    return () => { socket.off('puesto_actualizado', alCambiar); clearTimeout(temporizador); };
  }, [cargar]);

  if (error && !datos) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
  if (!datos) return <Cargando texto="Cargando estadísticas..." />;

  return (
    <>
      <div className="p-kpis">
        <div className="p-kpi"><span>Ingresos de hoy</span><strong>{pesos(datos.ingresos.hoy.total)}</strong></div>
        <div className="p-kpi"><span>Últimos 7 días</span><strong>{pesos(datos.ingresos.semana.total)}</strong></div>
        <div className="p-kpi"><span>Últimos 30 días</span><strong>{pesos(datos.ingresos.mes.total)}</strong></div>
        <div className="p-kpi"><span>Vehículos hoy</span><strong>{datos.ingresos.hoy.cantidad}</strong></div>
      </div>

      <div className="p-tarjeta">
        <h2>Ocupación actual por sede</h2>
        {datos.ocupacion.length === 0 ? (
          <Vacio titulo="Aún no hay sedes con puestos" />
        ) : (
          <div className="p-barras">
            {datos.ocupacion.map((s) => (
              <div key={s.parqueaderoId} className="p-barra-fila">
                <span>{s.nombre}</span>
                <div className="p-barra-pista" role="img" aria-label={`${s.nombre}: ${s.porcentaje}% ocupado`}>
                  <div className={`p-barra-relleno ${nivel(s.porcentaje)}`} style={{ width: `${s.porcentaje}%` }} />
                </div>
                <span>{s.porcentaje}% · {s.libres} libres</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-dos">
        <div className="p-tarjeta">
          <h2>Ingresos por día (últimos 14 días)</h2>
          {datos.ingresosPorDia.length === 0 ? (
            <Vacio titulo="Sin ingresos en el periodo" />
          ) : (
            <GraficaIngresos datos={datos.ingresosPorDia} />
          )}
        </div>

        <div className="p-tarjeta">
          <h2>Horas pico (últimos 7 días)</h2>
          {datos.horasPico.length === 0 ? (
            <Vacio titulo="Sin entradas registradas" />
          ) : (
            <GraficaHoras datos={datos.horasPico} />
          )}
        </div>
      </div>

      <div className="p-tarjeta">
        <h2>Vehículos más frecuentes (30 días)</h2>
        {datos.vehiculosFrecuentes.length === 0 ? (
          <Vacio titulo="Sin datos todavía" />
        ) : (
          <ul className="p-lista">
            {datos.vehiculosFrecuentes.map((v) => (
              <li key={v.placa}><strong>{v.placa}</strong><span>{v.visitas} {v.visitas === 1 ? 'visita' : 'visitas'}</span></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function VistaCliente() {
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/reservas', { params: { mias: true, estado: 'activa' } });
      setReservas(data.reservas);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar tus reservas'));
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <div className="p-tarjeta">
        <h2>Tus reservas activas</h2>
        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !reservas && <Cargando />}
        {reservas && reservas.length === 0 && (
          <Vacio icono="🅿️" titulo="No tienes reservas activas" texto="Reserva un puesto para asegurar tu espacio." />
        )}
        {reservas && reservas.length > 0 && (
          <ul className="p-lista">
            {reservas.map((r) => (
              <li key={r._id}><strong>{r.placa}</strong><span>{fechaHora(r.inicio)} → {fechaHora(r.fin)}</span></li>
            ))}
          </ul>
        )}
      </div>
      <p><Link to="/panel/reservas" className="p-boton">Reservar un puesto</Link></p>
    </>
  );
}

export default function Resumen() {
  const { usuario } = useAuth();
  const esStaff = usuario?.rol === 'admin' || usuario?.rol === 'operador';
  return (
    <>
      <h1 className="p-titulo">Hola, {usuario?.nombre}</h1>
      <p className="p-sub">{esStaff ? 'Resumen del día en todas las sedes.' : 'Tu actividad en Parking Tracker.'}</p>
      {esStaff ? <VistaStaff /> : <VistaCliente />}
    </>
  );
}
