// src/components/reviews/ReviewForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Rating,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { reviewsAPI, clientsAPI, venuesAPI } from '../../services/api';
import { getCurrentUser, getUserRole } from '../../utils/auth';

function ReviewForm() {
  const [review, setReview] = useState({
    id: '',
    id_client: '',
    id_venue: '',
    review_rating: 0,
    review_comments: '',
  });
  const [clients, setClients] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // NUEVO: Función para obtener el próximo ID disponible
  const fetchNextId = async () => {
    try {
      // Opción A: Si tu API tiene un endpoint específico para obtener el próximo ID
      // const response = await reviewsAPI.getNextId();
      // return response.data.nextId;
      
      // Opción B: Obtener todas las reseñas y calcular el próximo ID
      const response = await reviewsAPI.getAll();
      const maxId = Math.max(...response.data.map(review => review.id), 0);
      return maxId + 1;
    } catch (error) {
      console.error('Error al obtener el próximo ID:', error);
      // Fallback: retornar 1 si hay error
      return 1;
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // MODIFICADO: useEffect actualizado para generar ID automáticamente
  useEffect(() => {
    if (isEdit && clients.length > 0 && venues.length > 0) {
      fetchReview();
    } else if (!isEdit && clients.length > 0 && venues.length > 0) {
      // Para nueva reseña, generar el próximo ID automáticamente
      const generateId = async () => {
        try {
          const nextId = await fetchNextId();
          setReview(prev => ({ ...prev, id: nextId }));
        } catch (error) {
          setError('Error al generar el ID de la reseña');
          console.error('Error:', error);
        }
      };
      
      generateId();
    }
  }, [id, isEdit, clients.length, venues.length]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userRole = getUserRole();
      const currentUser = getCurrentUser();
      
      if (userRole === 'client') {
        // Si es cliente, solo cargar venues y auto-seleccionar el cliente actual
        const venuesResponse = await venuesAPI.getAll();
        setVenues(venuesResponse.data || []);
        setClients([]); // Los clientes no necesitan ver la lista de clientes
        
        // Auto-seleccionar el cliente actual
        setReview(prev => ({ 
          ...prev, 
          id_client: currentUser?.id || currentUser?.userId || ''
        }));
      } else {
        // Si es admin o superadmin, cargar todo
        const [clientsResponse, venuesResponse] = await Promise.all([
          clientsAPI.getAll(),
          venuesAPI.getAll()
        ]);
        
        setClients(clientsResponse.data || []);
        setVenues(venuesResponse.data || []);
      }
    } catch (error) {
      setError('Error al cargar los datos iniciales');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getById(id);
      setReview(response.data);
    } catch (error) {
      setError('Error al cargar los datos de la reseña');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleRatingChange = (event, newValue) => {
    setReview(prev => ({
      ...prev,
      review_rating: newValue
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const userRole = getUserRole();
    
    if (userRole !== 'client' && !review.id_client) {
      setError('Debe seleccionar un cliente');
      return false;
    }
    if (!review.id_venue) {
      setError('Debe seleccionar un lugar');
      return false;
    }
    if (!review.review_rating || review.review_rating < 1 || review.review_rating > 5) {
      setError('Debe seleccionar una calificación entre 1 y 5 estrellas');
      return false;
    }
    if (!review.review_comments.trim()) {
      setError('Los comentarios son requeridos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const userRole = getUserRole();
      const currentUser = getCurrentUser();
      
      // Para usuarios cliente, usar su propio ID
      let clientId = review.id_client;
      if (userRole === 'client') {
        clientId = currentUser?.id || currentUser?.userId;
        if (!clientId) {
          setError('Error al identificar el usuario. Por favor, inicia sesión nuevamente.');
          setLoading(false);
          return;
        }
      }
      
      if (isEdit) {
        const reviewData = {
          ...review,
          id_client: Number.parseInt(clientId),
          id_venue: Number.parseInt(review.id_venue),
          review_rating: Number.parseInt(review.review_rating),
          id: Number.parseInt(id)
        };
        await reviewsAPI.update(reviewData);
        setSuccess('Reseña actualizada exitosamente');
      } else {
        // Para creación, NO enviar ID local
        const reviewData = {
          id_client: Number.parseInt(clientId),
          id_venue: Number.parseInt(review.id_venue),
          review_rating: Number.parseInt(review.review_rating),
          review_comments: review.review_comments
        };
        
        console.log('Creating review with data:', reviewData);
        await reviewsAPI.create(reviewData);
        setSuccess('Reseña creada exitosamente');
      }
      
      setTimeout(() => {
        navigate('/reviews');
      }, 1500);
    } catch (error) {
      setError(isEdit ? 'Error al actualizar la reseña' : 'Error al crear la reseña');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // MODIFICADO: Mostrar loading también cuando se está generando el ID
  if (loading && (isEdit || clients.length === 0 || venues.length === 0 || (!isEdit && !review.id))) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {isEdit ? 'Cargando reseña...' : 'Generando ID...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reviews')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Reseña' : 'Nueva Reseña'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ID"
                  name="id"
                  value={review.id}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={isEdit ? "ID de la reseña (solo lectura)" : "ID generado automáticamente"}
                />
              </Grid>
              
              {getUserRole() !== 'client' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Cliente"
                    name="id_client"
                    value={review.id_client}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <MenuItem value="">Seleccionar cliente</MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Lugar"
                  name="id_venue"
                  value={review.id_venue}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <MenuItem value="">Seleccionar lugar</MenuItem>
                  {venues.map((venue) => (
                    <MenuItem key={venue.id} value={venue.id}>
                      {venue.venue_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Typography component="legend" sx={{ mb: 1 }}>
                  Calificación *
                </Typography>
                <Rating
                  name="review_rating"
                  value={review.review_rating}
                  onChange={handleRatingChange}
                  size="large"
                  disabled={loading}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Seleccione de 1 a 5 estrellas
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Comentarios"
                  name="review_comments"
                  multiline
                  rows={4}
                  value={review.review_comments}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Escriba sus comentarios sobre el lugar y el servicio..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/reviews')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ReviewForm;