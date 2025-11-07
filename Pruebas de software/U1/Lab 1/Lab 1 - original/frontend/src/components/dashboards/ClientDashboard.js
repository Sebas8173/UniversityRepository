// src/components/dashboards/ClientDashboard.js
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
  EventNote,
  RestaurantMenu,
  RateReview,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { menusAPI, eventsAPI, venuesAPI, reviewsAPI } from '../../services/api';

function ClientDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    menus: 0,
    events: 0,
    venues: 0,
    reviews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          menusRes,
          eventsRes,
          venuesRes,
          reviewsRes,
        ] = await Promise.all([
          menusAPI.getAll(),
          eventsAPI.getAll(),
          venuesAPI.getAll(),
          reviewsAPI.getAll(),
        ]);

        setStats({
          menus: menusRes.data?.length || 0,
          events: eventsRes.data?.length || 0,
          venues: venuesRes.data?.length || 0,
          reviews: reviewsRes.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const clientActions = [
    {
      title: 'Ver Menús',
      description: 'Explora nuestros menús disponibles',
      icon: <RestaurantMenu sx={{ fontSize: 40, color: '#1976d2' }} />,
      count: stats.menus,
      action: () => navigate('/menus'),
    },
    {
      title: 'Ver Eventos',
      description: 'Conoce nuestros tipos de eventos',
      icon: <EventNote sx={{ fontSize: 40, color: '#4caf50' }} />,
      count: stats.events,
      action: () => navigate('/events'),
    },
    {
      title: 'Ver Venues',
      description: 'Descubre nuestros lugares disponibles',
      icon: <LocationOn sx={{ fontSize: 40, color: '#ff9800' }} />,
      count: stats.venues,
      action: () => navigate('/venues'),
    },
    {
      title: 'Mis Reseñas',
      description: 'Escribe y gestiona tus reseñas',
      icon: <RateReview sx={{ fontSize: 40, color: '#9c27b0' }} />,
      count: stats.reviews,
      action: () => navigate('/reviews'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard del Cliente
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido a QuickQuote Catering
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {clientActions.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
                  Ver más
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Acceso Rápido
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/reservations/new')}
            >
              Hacer una Reservación
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/reviews/new')}
            >
              Escribir una Reseña
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default ClientDashboard;
