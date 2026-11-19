import { useEffect, useState } from 'react';
import api from '../services/api';

// Lista de sedes (parqueaderos) para los selectores. La lectura es publica.
export default function useSedes() {
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    api.get('/parqueaderos')
      .then(({ data }) => { if (activo) setSedes(data.parqueaderos); })
      .catch(() => { if (activo) setSedes([]); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  return { sedes, cargando };
}
