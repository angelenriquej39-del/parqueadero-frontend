import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RutaProtegida from './components/RutaProtegida';
import { Cargando } from './components/Estados';
import Footer from './components/Footer';

// Carga diferida (lazy) de cada pantalla: el navegador solo descarga lo que se usa.
const Home = lazy(() => import('./pages/Home'));
const Acceso = lazy(() => import('./pages/Acceso'));
const Parqueaderos = lazy(() => import('./pages/Parqueaderos'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminUsuarios = lazy(() => import('./pages/AdminUsuarios'));
const PanelLayout = lazy(() => import('./components/PanelLayout'));
const Resumen = lazy(() => import('./pages/panel/Resumen'));
const Reservas = lazy(() => import('./pages/panel/Reservas'));
const Puestos = lazy(() => import('./pages/panel/Puestos'));
const Historial = lazy(() => import('./pages/panel/Historial'));
const Pagos = lazy(() => import('./pages/panel/Pagos'));
const Tarifas = lazy(() => import('./pages/panel/Tarifas'));
const Caja = lazy(() => import('./pages/panel/Caja'));
const Reportes = lazy(() => import('./pages/panel/Reportes'));
const Auditoria = lazy(() => import('./pages/panel/Auditoria'));

const STAFF = ['admin', 'operador'];

// Ver los parqueaderos y sus puestos NO requiere sesion. El login se pide solo
// al registrar movimientos o entrar al panel. Cada ruta del panel valida el rol
// (el backend vuelve a validarlo en la API).
function App() {
  const { pathname } = useLocation();
  return (
    <>
      <Suspense fallback={<Cargando texto="Cargando..." />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/acceso" element={<Acceso />} />
          <Route path="/parqueaderos" element={<Parqueaderos />} />
          <Route path="/dashboard/:parqueaderoId" element={<Dashboard />} />
          <Route
            path="/admin/usuarios"
            element={
              <RutaProtegida roles={['admin']}>
                <AdminUsuarios />
              </RutaProtegida>
            }
          />
          <Route
            path="/panel"
            element={
              <RutaProtegida>
                <PanelLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<Resumen />} />
            <Route path="puestos" element={<Puestos />} />
            <Route path="reservas" element={<Reservas />} />
            <Route path="historial" element={<Historial />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="tarifas" element={<Tarifas />} />
            <Route path="caja" element={<RutaProtegida roles={STAFF}><Caja /></RutaProtegida>} />
            <Route path="reportes" element={<RutaProtegida roles={STAFF}><Reportes /></RutaProtegida>} />
            <Route path="auditoria" element={<RutaProtegida roles={['admin']}><Auditoria /></RutaProtegida>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {pathname !== '/' && <Footer />}
    </>
  );
}

export default App;
