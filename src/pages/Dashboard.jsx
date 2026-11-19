import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlanoParqueadero from '../components/PlanoParqueadero';
import HorasPico from '../components/HorasPico';
import BrandLogo from '../components/BrandLogo';
import { obtenerLayoutNivel } from '../utils/layoutMallPlaza';
import api from '../services/api';
import './Dashboard.css';

// Pantalla PUBLICA en modo lectura: cualquiera ve el plano en vivo.
// Los usuarios autenticados pueden registrar entradas y salidas; solo admin
// puede modificar la distribucion y agregar puestos.
export default function Dashboard() {
  const { parqueaderoId } = useParams();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [parqueadero, setParqueadero] = useState(null);
  const [nivel, setNivel] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const { usuario, estaLogueado, logout } = useAuth();

  // Cargamos el parqueadero elegido para saber su nombre y que niveles
  // tiene (cada sede puede tener niveles distintos, ej: solo "Nivel 1").
  useEffect(() => {
    async function cargarParqueadero() {
      setCargando(true);
      try {
        const respuesta = await api.get(`/parqueaderos/${parqueaderoId}`);
        setParqueadero(respuesta.data.parqueadero);
        setNivel(respuesta.data.parqueadero.niveles?.[0] || 'Nivel 1');
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar el parqueadero');
      } finally {
        setCargando(false);
      }
    }
    cargarParqueadero();
  }, [parqueaderoId]);

  const niveles = parqueadero?.niveles?.length ? parqueadero.niveles : ['Nivel 1'];
  const volver = encodeURIComponent(`/dashboard/${parqueaderoId}`);

  return (
    <div className="dashboard-fondo">
      <header className="dashboard-header">
        <div className="dashboard-header-izquierda">
          <Link to="/parqueaderos" className="dashboard-volver">← Parqueaderos</Link>
          <span className="dashboard-separador">|</span>
          <span className="dashboard-logo">
            <BrandLogo className="dashboard-logo-imagen" />
            <span>{parqueadero?.nombre || 'Cargando...'}</span>
          </span>
        </div>
        <div className="dashboard-usuario">
          {estaLogueado ? (
            <>
              <Link to="/panel" className="dashboard-link-admin">📊 Panel</Link>
              {usuario?.rol === 'admin' && (
                <Link to="/admin/usuarios" className="dashboard-link-admin">👥 Usuarios</Link>
              )}
              <span>Hola, {usuario?.nombre}</span>
              <span className="dashboard-rol">
                {{ admin: 'Administrador', operador: 'Operador', cliente: 'Cliente' }[usuario?.rol] || usuario?.rol}
              </span>
              <button onClick={logout} className="dashboard-boton-salir">Salir</button>
            </>
          ) : (
            <>
              <Link to={`/acceso?modo=login&volver=${volver}`} className="dashboard-link-admin">Iniciar sesión</Link>
              <Link to={`/acceso?modo=registro&volver=${volver}`} className="dashboard-link-admin">Registrarme</Link>
            </>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {cargando && <p className="dashboard-ayuda">Cargando parqueadero...</p>}
        {error && <p className="dashboard-ayuda" style={{ color: '#dc2626' }}>{error}</p>}

        {!cargando && !error && nivel && (
          <>
            {!estaLogueado && (
              <div className="dashboard-aviso-visitante">
                👀 Estás viendo el plano en vivo. Toca un puesto para elegirlo; te pediremos iniciar sesión
                solo cuando quieras registrar la entrada.
              </div>
            )}

            <div className="dashboard-encabezado-plano">
              <div>
                <h1 className="dashboard-titulo">Plano del parqueadero · {obtenerLayoutNivel(nivel).etiqueta}</h1>
                <p className="dashboard-ayuda">
                  {modoEdicion
                    ? 'Arrastra cada puesto para ubicarlo donde corresponde en el plano, o agrega puestos nuevos.'
                    : estaLogueado
                    ? 'Haz clic en un puesto libre para registrar la entrada de un vehículo, o en uno ocupado para registrar su salida.'
                    : 'Verde es libre, rojo es ocupado. Se actualiza solo, en tiempo real.'}
                </p>
              </div>
              {usuario?.rol === 'admin' && (
                <button
                  onClick={() => setModoEdicion((v) => !v)}
                  className={`dashboard-boton-edicion ${modoEdicion ? 'activo' : ''}`}
                >
                  {modoEdicion ? '✅ Terminar edición' : '✏️ Editar posiciones'}
                </button>
              )}
            </div>

            <div className="dashboard-tabs-nivel">
              {niveles.map((n) => (
                <button
                  key={n}
                  onClick={() => setNivel(n)}
                  className={`dashboard-tab ${nivel === n ? 'activo' : ''}`}
                >
                  {obtenerLayoutNivel(n).etiqueta}
                </button>
              ))}
            </div>

            <div className="dashboard-plano-card">
              <PlanoParqueadero parqueaderoId={parqueaderoId} modoEdicion={modoEdicion} nivel={nivel} />
            </div>

            {estaLogueado && (
              <div className="dashboard-plano-card dashboard-reporte">
                <HorasPico parqueaderoId={parqueaderoId} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
