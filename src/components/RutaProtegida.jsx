import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege una ruta por sesion y, opcionalmente, por rol.
//   <RutaProtegida roles={['admin', 'operador']}>...</RutaProtegida>
// `soloAdmin` se conserva por compatibilidad con el codigo anterior.
export default function RutaProtegida({ children, soloAdmin = false, roles }) {
  const { estaLogueado, usuario } = useAuth();

  if (!estaLogueado) {
    return <Navigate to="/acceso?modo=login" replace />;
  }

  const permitidos = roles || (soloAdmin ? ['admin'] : null);
  if (permitidos && !permitidos.includes(usuario?.rol)) {
    return <Navigate to="/panel" replace />;
  }

  return children;
}
