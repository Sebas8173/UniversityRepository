// src/components/events/EventForm.js
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
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsAPI } from '../../services/api';

function EventForm() {
  const [event, setEvent] = useState({
    id: '',
    event_name: '',
    event_date: '',
    event_location: '',
    event_type: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Función para generar ID automáticamente
  const generateNextId = () => {
    return Date.now(); // Usar timestamp como ID único
  };

  // useEffect para cargar datos en edición o generar ID para creación
  useEffect(() => {
    if (isEdit) {
      fetchEvent(); // Si es edición, obtener los datos del evento
    } else {
      // Para nuevo evento, generar ID automáticamente
      const newId = generateNextId();
      setEvent(prev => ({ ...prev, id: newId }));
    }
  }, [id, isEdit]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);
      const eventData = response.data;
      if (eventData.event_date) {
        eventData.event_date = new Date(eventData.event_date).toISOString().split('T')[0];
      }
      setEvent(eventData);
    } catch (error) {
      setError('Error al cargar los datos del evento');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!event.event_name.trim()) {
      setError('El nombre del evento es requerido');
      return false;
    }
    if (!event.event_date.trim()) {
      setError('La fecha del evento es requerida');
      return false;
    }
    if (!event.event_location.trim()) {
      setError('La ubicación del evento es requerida');
      return false;
    }
    if (!event.event_type.trim()) {
      setError('El tipo de evento es requerido');
      return false;
    }

    // Validar que la fecha no sea en el pasado
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      setError('La fecha del evento no puede ser en el pasado');
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
      
      // Formatear la fecha para envío
      const eventData = {
        ...event,
        event_date: new Date(event.event_date).toISOString(),
      };
      
      if (isEdit) {
        await eventsAPI.update({ ...eventData, id: parseInt(id) });
        setSuccess('Evento actualizado exitosamente');
      } else {
        await eventsAPI.create({ ...eventData, id: parseInt(event.id) });
        setSuccess('Evento creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (error) {
      setError(isEdit ? 'Error al actualizar el evento' : 'Error al crear el evento');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // MODIFICADO: Mostrar loading también cuando se está generando el ID
  if (loading && (isEdit || !event.id)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {isEdit ? 'Cargando evento...' : 'Generando ID...'}
        </Typography>
      </Box>
    );
  }

  // Asegurarse de que el valor de ID no sea NaN
  const safeEventId = isNaN(event.id) ? '' : event.id;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/events')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Evento' : 'Nuevo Evento'}
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
                  value={safeEventId} // Usar la variable segura
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={isEdit ? "ID del evento (solo lectura)" : "ID generado automáticamente"}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nombre del Evento"
                  name="event_name"
                  value={event.event_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha del Evento"
                  name="event_date"
                  type="date"
                  value={event.event_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo de Evento"
                  name="event_type"
                  value={event.event_type}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Ej: Boda, Cumpleaños, Corporativo..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  name="event_location"
                  value={event.event_location}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/events')}
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

export default EventForm;
