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
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { reservationsAPI, clientsAPI, menusAPI } from '../../services/api';

function ReservationForm() {
  const [reservation, setReservation] = useState({
    id_client: '',
    reservation_date: '',
    reservation_time: '',
    number_of_guests: 1,
    menu_id: '',
  });
  const [clients, setClients] = useState([]);
  const [menus, setMenus] = useState([]);
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
    if (isEdit && id) {
      fetchReservation();
    }
  }, [id, isEdit]);

  const fetchInitialData = async () => {
    try {
      setDataLoading(true);
      const [clientsRes, menusRes] = await Promise.all([
        clientsAPI.getAll(),
        menusAPI.getAll(),
      ]);
      setClients(clientsRes.data || []);
      setMenus(menusRes.data || []);
    } catch (error) {
      setError('Error loading initial data');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getById(id);
      const data = response.data;
      setReservation({
        id_client: String(data.id_client) || '',
        reservation_date: data.reservation_date || '',
        reservation_time: data.reservation_time || '',
        number_of_guests: data.number_of_guests || 1,
        menu_id: String(data.menu_id) || '',
      });
    } catch (error) {
      setError('Error loading reservation data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReservation((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!reservation.id_client) {
      setError('Client is required');
      return false;
    }
    if (!reservation.reservation_date) {
      setError('Reservation date is required');
      return false;
    }
    if (!reservation.reservation_time) {
      setError('Reservation time is required');
      return false;
    }
    if (!reservation.number_of_guests || reservation.number_of_guests <= 0) {
      setError('Number of guests must be greater than 0');
      return false;
    }
    if (!reservation.menu_id) {
      setError('Menu is required');
      return false;
    }

    const selectedClient = clients.find(
      (c) => String(c.id_client) === String(reservation.id_client)
    );
    if (!selectedClient) {
      setError('Selected client is invalid');
      return false;
    }

    const selectedMenu = menus.find(
      (m) => String(m.id || m._id || m.menu_id) === String(reservation.menu_id)
    );
    if (!selectedMenu) {
      setError('Selected menu is invalid');
      return false;
    }

    const reservationDateTime = new Date(
      `${reservation.reservation_date}T${reservation.reservation_time}`
    );
    if (reservationDateTime < new Date()) {
      setError('Reservation date and time cannot be in the past');
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

      const selectedClient = clients.find(
        (c) => String(c.id_client) === String(reservation.id_client)
      );
      const selectedMenu = menus.find(
        (m) => String(m.id || m._id || m.menu_id) === String(reservation.menu_id)
      );

      if (!selectedClient || !selectedMenu) {
        setError('Selected client or menu not found');
        return;
      }

      const reservationData = {
        id_client: selectedClient.id_client, // Use string id_client
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        number_of_guests: Number.parseInt(reservation.number_of_guests),
        menu_id: Number.parseInt(selectedMenu.id || selectedMenu._id || selectedMenu.menu_id),
      };

      if (isEdit) {
        await reservationsAPI.update({ ...reservationData, id: Number.parseInt(id) });
        setSuccess('Reservation updated successfully');
      } else {
        await reservationsAPI.create(reservationData); // No id included for creation
        setSuccess('Reservation created successfully');
      }

      setTimeout(() => {
        navigate('/reservations');
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Unknown error';
      setError(`Error ${isEdit ? 'updating' : 'creating'} reservation: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/reservations');
  };

  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Edit Reservation' : 'New Reservation'}
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select
                    name="id_client"
                    value={reservation.id_client}
                    onChange={handleChange}
                    disabled={loading}
                    label="Client"
                  >
                    <MenuItem value="">
                      <em>Select client</em>
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem
                        key={client.id_client}
                        value={String(client.id_client)}
                      >
                        {(client.first_name || client.firstName || '') +
                          ' ' +
                          (client.last_name || client.lastName || '')} (ID:{' '}
                        {client.id_client})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Menu</InputLabel>
                  <Select
                    name="menu_id"
                    value={reservation.menu_id}
                    onChange={handleChange}
                    disabled={loading}
                    label="Menu"
                  >
                    <MenuItem value="">
                      <em>Select menu</em>
                    </MenuItem>
                    {menus.map((menu) => {
                      const menuId = menu.id || menu._id || menu.menu_id;
                      return (
                        <MenuItem key={menuId} value={String(menuId)}>
                          {(menu.menu_name || menu.name || 'Unnamed Menu')} - $
                          {menu.menu_price || menu.price || 0} (ID: {menuId})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reservation Date"
                  name="reservation_date"
                  type="date"
                  value={reservation.reservation_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reservation Time"
                  name="reservation_time"
                  type="time"
                  value={reservation.reservation_time}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Number of Guests"
                  name="number_of_guests"
                  type="number"
                  value={reservation.number_of_guests}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    disabled={loading}
                    color="primary"
                  >
                    {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
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

export default ReservationForm;