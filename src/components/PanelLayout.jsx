import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useTema from '../hooks/useTema';
import BrandLogo from './BrandLogo';
import CampanaNotificaciones from './CampanaNotificaciones';
import './PanelLayout.css';

const ETIQUETA_ROL = { admin: 'Administrador', operador: 'Operador', cliente: 'Cliente' };

// Enlaces del panel. `roles` define quien los ve (el backend igual valida).
const ENLACES = [
  { a: '/panel', texto: 'Resumen', fin: true, roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/puestos', texto: 'Puestos', roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/reservas', texto: 'Reservas', roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/historial', texto: 'Historial', roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/pagos', texto: 'Pagos', roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/tarifas', texto: 'Tarifas', roles: ['admin', 'operador', 'cliente'] },
  { a: '/panel/caja', texto: 'Caja', roles: ['admin', 'operador'] },
  { a: '/panel/reportes', texto: 'Reportes', roles: ['admin', 'operador'] },
  { a: '/panel/auditoria', texto: 'Auditoría', roles: ['admin'] },
  { a: '/admin/usuarios', texto: 'Usuarios', roles: ['admin'] },
];

export default function PanelLayout() {
  const { usuario, logout } = useAuth();
  const { tema, alternar } = useTema();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  const enlaces = ENLACES.filter((e) => e.roles.includes(usuario?.rol));

  return (
    <div className="panel">
      <header className="panel-header">
        <div className="panel-header-izq">
          <button
            type="button"
            className="panel-hamburguesa"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={menuAbierto}
            aria-controls="panel-menu"
          >
            <span aria-hidden="true">{menuAbierto ? '✕' : '☰'}</span>
          </button>
          <Link to="/parqueaderos" className="panel-marca">
            <BrandLogo className="panel-logo" />
            <span>Parking Tracker</span>
          </Link>
        </div>

        <div className="panel-header-der">
          <button
            type="button"
            className="panel-icono"
            onClick={alternar}
            aria-label={tema === 'oscuro' ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
          >
            <span aria-hidden="true">{tema === 'oscuro' ? '☀️' : '🌙'}</span>
          </button>
          <CampanaNotificaciones />
          <span className="panel-usuario">
            {usuario?.nombre} · <em>{ETIQUETA_ROL[usuario?.rol] || usuario?.rol}</em>
          </span>
          <button type="button" className="panel-salir" onClick={logout}>Salir</button>
        </div>
      </header>

      <nav
        id="panel-menu"
        className={`panel-menu ${menuAbierto ? 'abierto' : ''}`}
        aria-label="Navegación del panel"
      >
        {enlaces.map((e) => (
          <NavLink
            key={e.a}
            to={e.a}
            end={e.fin}
            onClick={() => setMenuAbierto(false)}
            className={({ isActive }) => `panel-enlace ${isActive ? 'activo' : ''}`}
          >
            {e.texto}
          </NavLink>
        ))}
        <Link to="/parqueaderos" className="panel-enlace" onClick={() => setMenuAbierto(false)}>
          Plano en vivo
        </Link>
      </nav>

      <main className="panel-contenido" key={ubicacion.pathname}>
        <Outlet />
      </main>
    </div>
  );
}
