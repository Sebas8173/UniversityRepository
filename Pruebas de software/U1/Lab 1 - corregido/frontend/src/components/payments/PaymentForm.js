// src/components/payments/PaymentForm.js
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
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import { Save, ArrowBack, AttachMoney } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentsAPI, reservationsAPI, clientsAPI } from '../../services/api';
import { getCurrentUser, getUserRole } from '../../utils/auth';

function PaymentForm() {
  const [payment, setPayment] = useState({
    id_reservation: '',
    payment_amount: '',
    payment_date: '',
  });
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEdit && reservations.length > 0) {
      fetchPayment();
    }
  }, [id, isEdit, reservations]);

  const fetchInitialData = async () => {
    try {
      setDataLoading(true);
      const userRole = getUserRole();
      const currentUser = getCurrentUser();
      
      if (userRole === 'client') {
        // Si es cliente, solo mostrar sus propias reservaciones
        const [reservationsRes] = await Promise.all([
          reservationsAPI.getAll(),
        ]);
        
        // Filtrar reservaciones del cliente actual
        const clientReservations = reservationsRes.data?.filter(res => 
          res.id_client === currentUser?.id || res.id_client === currentUser?.userId
        ) || [];
        
        setReservations(clientReservations);
        setClients([]); // Los clientes no necesitan ver la lista de clientes
      } else {
        // Si es admin o superadmin, mostrar todo
        const [reservationsRes, clientsRes] = await Promise.all([
          reservationsAPI.getAll(),
          clientsAPI.getAll(),
        ]);
        
        setReservations(reservationsRes.data || []);
        setClients(clientsRes.data || []);
      }
    } catch (error) {
      setError('Error al cargar los datos iniciales');
      console.error('Error:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getById(id);
      const data = response.data;
      
      setPayment({
        id_reservation: data.id_reservation || '',
        payment_amount: data.payment_amount || '',
        payment_date: data.payment_date || '',
      });
    } catch (error) {
      setError('Error al cargar los datos del pago');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayment(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!payment.id_reservation) {
      setError('La reservación es requerida');
      return false;
    }
    if (!payment.payment_amount || payment.payment_amount <= 0) {
      setError('El monto del pago debe ser mayor a 0');
      return false;
    }
    if (!payment.payment_date) {
      setError('La fecha de pago es requerida');
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
      
      const paymentData = {
        ...payment,
        id_reservation: Number.parseInt(payment.id_reservation),
        payment_amount: Number.parseFloat(payment.payment_amount),
      };

      if (isEdit) {
        await paymentsAPI.update({ ...paymentData, id: Number.parseInt(id) });
        setSuccess('Pago actualizado exitosamente');
      } else {
        await paymentsAPI.create(paymentData);
        setSuccess('Pago creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/payments');
      }, 1500);
    } catch (error) {
      setError(isEdit ? 'Error al actualizar el pago' : 'Error al crear el pago');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (reservationId) => {
    const reservation = reservations.find(r => r.id === Number.parseInt(reservationId));
    if (!reservation) return '';
    
    const client = clients.find(c => c.id === reservation.id_client);
    return client ? `${client.first_name} ${client.last_name}` : '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (dataLoading) {
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
          onClick={() => navigate('/payments')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Pago' : 'Nuevo Pago'}
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
                <FormControl fullWidth required>
                  <InputLabel>Reservación</InputLabel>
                  <Select
                    name="id_reservation"
                    value={payment.id_reservation}
                    onChange={handleChange}
                    disabled={loading}
                    label="Reservación"
                  >
                    {reservations.map((reservation) => (
                      <MenuItem key={reservation.id} value={reservation.id}>
                        Reservación #{reservation.id} - {getClientName(reservation.id)} - {formatDate(reservation.reservation_date)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monto del Pago"
                  name="payment_amount"
                  type="number"
                  value={payment.payment_amount}
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
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Pago"
                  name="payment_date"
                  type="date"
                  value={payment.payment_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/payments')}
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

export default PaymentForm;