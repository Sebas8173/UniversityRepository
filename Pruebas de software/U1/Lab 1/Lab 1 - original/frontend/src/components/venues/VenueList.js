// src/components/venues/VenueList.js
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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LocationOn,
  People,
  Business,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { venuesAPI } from '../../services/api';

function VenueList() {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, venue: null });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    const filtered = venues.filter(venue =>
      venue.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.venue_location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVenues(filtered);
  }, [venues, searchTerm]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venuesAPI.getAll();
      setVenues(response.data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await venuesAPI.delete(deleteDialog.venue.id);
      setDeleteDialog({ open: false, venue: null });
      fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  };

  const openDeleteDialog = (venue) => {
    setDeleteDialog({ open: true, venue });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, venue: null });
  };

  const getCapacityColor = (capacity) => {
    if (capacity <= 50) return 'primary';
    if (capacity <= 100) return 'secondary';
    if (capacity <= 200) return 'success';
    return 'warning';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando lugares...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Lugares</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/venues/new')}
        >
          Nuevo Lugar
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar lugares por nombre o ubicación..."
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

      {filteredVenues.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron lugares
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/venues/new')}
            sx={{ mt: 2 }}
          >
            Crear primer lugar
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredVenues.map((venue) => (
            <Grid item xs={12} md={6} lg={4} key={venue.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {venue.venue_name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/venues/edit/${venue.id}`)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(venue)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {venue.venue_location}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Chip 
                      label={`${venue.venue_capacity} personas`} 
                      size="small" 
                      variant="outlined"
                      color={getCapacityColor(venue.venue_capacity)}
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
            ¿Está seguro que desea eliminar el lugar{' '}
            <strong>{deleteDialog.venue?.venue_name}</strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default VenueList;