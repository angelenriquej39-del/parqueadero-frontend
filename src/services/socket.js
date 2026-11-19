import { io } from 'socket.io-client';
import { API_URL } from './api';

// Creamos UNA sola conexion de socket para toda la app (no una por componente).
// Si hay sesion, mandamos el token para entrar a la sala privada del usuario
// (notificaciones). Sin sesion queda como visitante (plano en vivo publico).
const socket = io(API_URL, {
  autoConnect: true,
  auth: (enviar) => enviar({ token: localStorage.getItem('token') || undefined }),
});

// Al iniciar o cerrar sesion reconectamos para renovar las salas.
export function reconectarSocket() {
  socket.disconnect();
  socket.connect();
}

export default socket;
