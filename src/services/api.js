import axios from 'axios';

// URL base de nuestro backend. La sacamos de una variable de entorno
// para que sea facil cambiarla despues (ej: cuando despleguemos a produccion).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: antes de CADA peticion, si hay un token guardado,
// lo agregamos automaticamente al header Authorization.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el servidor responde 401 con una sesion guardada (token vencido o
// invalido) avisamos a la app para que cierre la sesion automaticamente.
// Los errores de /auth (clave incorrecta) NO cuentan como sesion vencida.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && localStorage.getItem('token') && !url.startsWith('/auth')) {
      window.dispatchEvent(new Event('sesion-expirada'));
    }
    return Promise.reject(error);
  },
);

// Texto de error legible para mostrar en un toast.
export function mensajeError(error, porDefecto = 'Ocurrio un error. Intenta de nuevo.') {
  if (error?.response?.data instanceof Blob) return porDefecto;
  return error?.response?.data?.error || error?.response?.data?.message
    || (error?.request && !error?.response ? 'No hay conexion con el servidor' : porDefecto);
}

// Descarga un archivo (PDF/Excel) protegido por token y lo guarda en el equipo.
export async function descargarArchivo(ruta, params, nombreSugerido) {
  const respuesta = await api.get(ruta, { params, responseType: 'blob' });
  const disposicion = respuesta.headers['content-disposition'] || '';
  const coincide = /filename="?([^";]+)"?/i.exec(disposicion);
  const nombre = coincide?.[1] || nombreSugerido;
  const url = URL.createObjectURL(respuesta.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export default api;
export { API_URL };
