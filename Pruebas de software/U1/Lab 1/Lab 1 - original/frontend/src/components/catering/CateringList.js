// src/components/catering/CateringList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  RoomService,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cateringAPI } from '../../services/api';

function CateringList() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_price?.toString().includes(searchTerm)
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await cateringAPI.getAll();
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching catering services:', error);
      setServices([]);
      setAlert({ 
        show: true, 
        message: 'Error al cargar los servicios de catering', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await cateringAPI.delete(deleteDialog.service.id);
      setDeleteDialog({ open: false, service: null });
      setAlert({ show: true, message: 'Servicio eliminado exitosamente', severity: 'success' });
      fetchServices();
    } catch (error) {
      console.error('Error deleting catering service:', error);
      setAlert({ 
        show: true, 
        message: 'Error al eliminar el servicio: ' + (error.response?.data?.message || error.message), 
        severity: 'error' 
      });
      setDeleteDialog({ open: false, service: null });
    }
  };

  const openDeleteDialog = (service) => {
    setDeleteDialog({ open: true, service });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, service: null });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando servicios de catering...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Servicios de Catering</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/catering/new')}
        >
          Nuevo Servicio
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar servicios por nombre, descripción o precio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredServices.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron servicios de catering
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/catering/new')}
            sx={{ mt: 2 }}
          >
            Crear primer servicio
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredServices.map((service) => (
            <Grid item xs={12} md={6} lg={4} key={service.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {service.service_name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/catering/edit/${service.id}`)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(service)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <RoomService sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.service_description}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="h6" color="primary">
                        {formatPrice(service.service_price)}
                      </Typography>
                    </Box>
                    <Chip
                      label="Disponible"
                      color="success"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el servicio{' '}
            <strong>{deleteDialog.service?.service_name}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mostrar alertas */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, show: false })} 
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CateringList;