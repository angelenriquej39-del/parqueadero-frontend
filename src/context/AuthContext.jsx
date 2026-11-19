import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { reconectarSocket } from '../services/socket';
import { iniciarSesionConGoogle } from '../services/firebase';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  function guardarSesion(token, datosUsuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
    reconectarSocket();
    return datosUsuario;
  }

  async function login(email, password) {
    const respuesta = await api.post('/auth/login', { email, password });
    return guardarSesion(respuesta.data.token, respuesta.data.usuario);
  }

  async function sincronizarConBackend(idToken) {
    const respuesta = await api.post('/auth/firebase', { idToken });
    return guardarSesion(respuesta.data.token, respuesta.data.usuario);
  }

  async function loginWithGoogle() {
    const idToken = await iniciarSesionConGoogle();
    return sincronizarConBackend(idToken);
  }

  async function loginWithPhone(idToken) {
    return sincronizarConBackend(idToken);
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    reconectarSocket();
  }, []);

  // Token vencido o invalido (401): cerramos sesion y avisamos.
  useEffect(() => {
    function alExpirar() {
      logout();
      toast?.info('Tu sesión expiró. Inicia sesión de nuevo.');
    }
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, [logout, toast]);

  const estaLogueado = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, login, loginWithGoogle, loginWithPhone, logout, estaLogueado }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
