// src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasRole } from '../../utils/auth';
import { Alert, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles, fallback = null }) => {
  const hasPermission = hasRole(requiredRoles);
  
  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta página.
        </Alert>
      </Box>
    );
  }
  
  return children;
};

export default ProtectedRoute;
