// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser, hasRole } from '../utils/auth';
import { Box, Alert } from '@mui/material';

function ProtectedRoute({ children, requiredRole, fallbackPath = '/dashboard' }) {
  const user = getCurrentUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta página. 
          Se requiere el rol: {Array.isArray(requiredRole) ? requiredRole.join(' o ') : requiredRole}
        </Alert>
      </Box>
    );
  }

  return children;
}

export default ProtectedRoute;
