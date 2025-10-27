// src/components/clients/ClientForm.js
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
import { clientsAPI } from '../../services/api';

function ClientForm() {
  const [client, setClient] = useState({
    id: '',
    id_client: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
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
      fetchClient();
    } else {
      // Para nuevo cliente, generar ID automáticamente
      const newId = generateNextId();
      setClient(prev => ({ 
        ...prev, 
        id: newId,
        id_client: newId // También establecer id_client para mostrar en el form
      }));
    }
  }, [id, isEdit]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getById(id);
      setClient(response.data);
    } catch (error) {
      setError('Error al cargar los datos del cliente');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!client.first_name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!client.last_name.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    if (!client.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!client.phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!client.address.trim()) {
      setError('La dirección es requerida');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
    if (!emailRegex.test(client.email)) {
      setError('El formato del email no es válido');
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
      
      if (isEdit) {
        // Para edición, mantener el ID existente
        const clientData = {
          ...client,
          id: Number.parseInt(id)
        };
        await clientsAPI.update(clientData);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        // Para creación, enviar id_client y otros campos (NO enviar id)
        const clientData = {
          id_client: client.id_client, // Usar el id_client temporal
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone,
          address: client.address
        };
        
        console.log('Creating client with data:', clientData);
        await clientsAPI.create(clientData);
        setSuccess('Cliente creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/clients');
      }, 1500);
    } catch (error) {
      console.error('Error saving client:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          (isEdit ? 'Error al actualizar el cliente' : 'Error al crear el cliente');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // MODIFICADO: Mostrar loading también cuando se está generando el ID
  if (loading && (isEdit || !client.id)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {isEdit ? 'Cargando cliente...' : 'Generando ID...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clients')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                  value={client.id}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={isEdit ? "ID del cliente (solo lectura)" : "ID generado automáticamente"}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="first_name"
                  value={client.first_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="last_name"
                  value={client.last_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={client.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={client.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Número de teléfono del cliente"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="address"
                  multiline
                  rows={3}
                  value={client.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Dirección completa del cliente"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/clients')}
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

export default ClientForm;