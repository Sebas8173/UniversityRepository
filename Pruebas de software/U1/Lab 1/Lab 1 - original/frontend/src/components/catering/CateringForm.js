// src/components/catering/CateringForm.js
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
  InputAdornment,
} from '@mui/material';
import { Save, ArrowBack, AttachMoney } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { cateringAPI } from '../../services/api';

function CateringForm() {
  const [service, setService] = useState({
    service_name: '',
    service_description: '',
    service_price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      fetchService();
    }
  }, [id, isEdit]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await cateringAPI.getById(id);
      setService(response.data);
    } catch (error) {
      setError('Error al cargar los datos del servicio de catering');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setService(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!service.service_name.trim()) {
      setError('El nombre del servicio es requerido');
      return false;
    }
    if (!service.service_description.trim()) {
      setError('La descripción del servicio es requerida');
      return false;
    }
    if (!service.service_price || service.service_price <= 0) {
      setError('El precio debe ser mayor a 0');
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
      
      const serviceData = {
        ...service,
        service_price: parseFloat(service.service_price),
      };

      if (isEdit) {
        await cateringAPI.update({ ...serviceData, id: parseInt(id) });
        setSuccess('Servicio de catering actualizado exitosamente');
      } else {
        await cateringAPI.create(serviceData);
        setSuccess('Servicio de catering creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/catering');
      }, 1500);
    } catch (error) {
      setError(isEdit ? 'Error al actualizar el servicio' : 'Error al crear el servicio');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/catering')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Servicio de Catering' : 'Nuevo Servicio de Catering'}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Servicio"
                  name="service_name"
                  value={service.service_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Ej: Servicio Completo de Catering, Buffet Premium, etc."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción del Servicio"
                  name="service_description"
                  multiline
                  rows={4}
                  value={service.service_description}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Describe el servicio incluido, personal, equipos, etc."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio del Servicio"
                  name="service_price"
                  type="number"
                  value={service.service_price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  inputProps={{ 
                    min: 0, 
                    step: 0.01 
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/catering')}
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

export default CateringForm;