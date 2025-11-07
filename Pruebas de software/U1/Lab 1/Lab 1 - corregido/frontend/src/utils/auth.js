// src/utils/auth.js
import { jwtDecode } from 'jwt-decode';

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    
    // Verificar si el token ha expirado
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem('token');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return null;
  }
};

export const hasRole = (requiredRoles) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  const userRole = user.role;
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  return userRole === requiredRoles;
};

export const isClient = () => hasRole('client');
export const isAdmin = () => hasRole(['admin', 'superadmin']);
export const isSuperAdmin = () => hasRole('superadmin');

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

// Función para obtener el rol del usuario actual
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

// Función para obtener información del usuario
export const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username || user.email?.split('@')[0] || 'Usuario',
    email: user.email,
    role: user.role,
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/auth';
};
