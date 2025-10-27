// src/components/dashboards/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
} from '@mui/material';
import {
  People,
  EventNote,
  RestaurantMenu,
  Payment,
  RoomService,
  Event,
  Group,
  LocationOn,
  RateReview,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  clientsAPI, 
  reservationsAPI, 
  menusAPI, 
  paymentsAPI,
  cateringAPI,
  eventsAPI,
  staffAPI,
  venuesAPI,
  reviewsAPI 
} from '../../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    reservations: 0,  
    menus: 0,
    payments: 0,
    catering: 0,
    events: 0,
    staff: 0,
    venues: 0,
    reviews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          clientsRes,
          reservationsRes,
          menusRes,
          paymentsRes,
          cateringRes,
          eventsRes,
          staffRes,
          venuesRes,
          reviewsRes,
        ] = await Promise.all([
          clientsAPI.getAll().catch(() => ({ data: [] })),
          reservationsAPI.getAll().catch(() => ({ data: [] })),
          menusAPI.getAll().catch(() => ({ data: [] })),
          paymentsAPI.getAll().catch(() => ({ data: [] })),
          cateringAPI.getAll().catch(() => ({ data: [] })),
          eventsAPI.getAll().catch(() => ({ data: [] })),
          staffAPI.getAll().catch(() => ({ data: [] })),
          venuesAPI.getAll().catch(() => ({ data: [] })),
          reviewsAPI.getAll().catch(() => ({ data: [] })),
        ]);

        setStats({
          clients: clientsRes.data?.length || 0,
          reservations: reservationsRes.data?.length || 0,
          menus: menusRes.data?.length || 0,
          payments: paymentsRes.data?.length || 0,
          catering: cateringRes.data?.length || 0,
          events: eventsRes.data?.length || 0,
          staff: staffRes.data?.length || 0,
          venues: venuesRes.data?.length || 0,
          reviews: reviewsRes.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const adminSections = [
    {
      title: 'Clientes',
      description: 'Gestionar clientes registrados',
      icon: <People sx={{ fontSize: 40, color: '#1976d2' }} />,
      count: stats.clients,
      action: () => navigate('/clients'),
    },
    {
      title: 'Reservaciones',
      description: 'Gestionar reservaciones',
      icon: <EventNote sx={{ fontSize: 40, color: '#4caf50' }} />,
      count: stats.reservations,
      action: () => navigate('/reservations'),
    },
    {
      title: 'Menús',
      description: 'Gestionar menús disponibles',
      icon: <RestaurantMenu sx={{ fontSize: 40, color: '#ff9800' }} />,
      count: stats.menus,
      action: () => navigate('/menus'),
    },
    {
      title: 'Pagos',
      description: 'Gestionar pagos y facturación',
      icon: <Payment sx={{ fontSize: 40, color: '#f44336' }} />,
      count: stats.payments,
      action: () => navigate('/payments'),
    },
    {
      title: 'Catering',
      description: 'Gestionar servicios de catering',
      icon: <RoomService sx={{ fontSize: 40, color: '#9c27b0' }} />,
      count: stats.catering,
      action: () => navigate('/catering'),
    },
    {
      title: 'Eventos',
      description: 'Gestionar tipos de eventos',
      icon: <Event sx={{ fontSize: 40, color: '#607d8b' }} />,
      count: stats.events,
      action: () => navigate('/events'),
    },
    {
      title: 'Personal',
      description: 'Gestionar personal y roles',
      icon: <Group sx={{ fontSize: 40, color: '#795548' }} />,
      count: stats.staff,
      action: () => navigate('/staff'),
    },
    {
      title: 'Venues',
      description: 'Gestionar lugares y espacios',
      icon: <LocationOn sx={{ fontSize: 40, color: '#3f51b5' }} />,
      count: stats.venues,
      action: () => navigate('/venues'),
    },
    {
      title: 'Reseñas',
      description: 'Gestionar reseñas de clientes',
      icon: <RateReview sx={{ fontSize: 40, color: '#00bcd4' }} />,
      count: stats.reviews,
      action: () => navigate('/reviews'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de Administrador
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Panel de control completo para gestión del sistema
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {adminSections.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={item.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {item.icon}
                  <Typography variant="h3" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {item.count}
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                >
                  Gestionar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/clients/new')}
            >
              Nuevo Cliente
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/menus/new')}
            >
              Nuevo Menú
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/venues/new')}
            >
              Nuevo Venue
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/staff/new')}
            >
              Nuevo Personal
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default AdminDashboard;
