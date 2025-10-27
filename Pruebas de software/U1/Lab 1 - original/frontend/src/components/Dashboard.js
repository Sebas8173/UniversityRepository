// src/components/Dashboard.js
import React from 'react';
import { getCurrentUser } from '../utils/auth';
import ClientDashboard from './dashboards/ClientDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import { Alert, Box, Typography, Paper } from '@mui/material';

function Dashboard() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error al cargar el usuario. Por favor, inicia sesión nuevamente.
        </Alert>
      </Box>
    );
  }

  // Mapa de Google con título
  const googleMapEmbed = (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Ubicación de Quick Quote
      </Typography>
      <Paper sx={{ width: '100%', maxWidth: 800, borderRadius: 2, boxShadow: 3 }}>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.468032377809!2d-78.44509422517184!3d-0.31482099968208377!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d5bd12538eb13b%3A0x907c61f1abbe45ab!2sUniversidad%20de%20las%20Fuerzas%20Armadas%20ESPE!5e1!3m2!1ses-419!2sec!4v1755067070742!5m2!1ses-419!2sec" 
          width="100%" 
          height="450" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </Paper>
    </Box>
  );

  // Mostrar dashboard según el rol del usuario
  switch (user.role) {
    case 'client':
      return (
        <>
          <ClientDashboard />
          {googleMapEmbed} {/* Mapa de Google debajo del dashboard del cliente */}
        </>
      );
    case 'admin':
      return (
        <>
          <AdminDashboard />
          {googleMapEmbed} {/* Mapa de Google debajo del dashboard del admin */}
        </>
      );
    case 'superadmin':
      return (
        <>
          <SuperAdminDashboard />
          {googleMapEmbed} {/* Mapa de Google debajo del dashboard del superadmin */}
        </>
      );
    default:
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            Rol de usuario no reconocido: {user.role}
          </Alert>
        </Box>
      );
  }
}

export default Dashboard;
