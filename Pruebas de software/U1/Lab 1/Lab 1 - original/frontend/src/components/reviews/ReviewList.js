// src/components/reviews/ReviewList.js
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
  Rating,
  Chip,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Person,
  LocationOn,
  Comment,
  FilterList,
  Star,
  Warning,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI, clientsAPI, venuesAPI } from '../../services/api';
import { hasRole } from '../../utils/auth';

function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [clients, setClients] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, review: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterMenu, setFilterMenu] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, searchTerm, clients, venues, ratingFilter, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, clientsResponse, venuesResponse] = await Promise.all([
        reviewsAPI.getAll(),
        clientsAPI.getAll(),
        venuesAPI.getAll()
      ]);
      
      setReviews(reviewsResponse.data || []);
      setClients(clientsResponse.data || []);
      setVenues(venuesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setReviews([]);
      setClients([]);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = reviews.filter(review => {
      const client = getClientName(review.id_client);
      const venue = getVenueName(review.id_venue);
      const searchLower = searchTerm.toLowerCase();
      
      // Filtro de texto
      const matchesSearch = client.toLowerCase().includes(searchLower) ||
                           venue.toLowerCase().includes(searchLower) ||
                           review.review_comments?.toLowerCase().includes(searchLower);

      // Filtro de calificación
      const matchesRating = ratingFilter === 'all' || 
                           (ratingFilter === 'high' && review.review_rating >= 4) ||
                           (ratingFilter === 'medium' && review.review_rating >= 2 && review.review_rating < 4) ||
                           (ratingFilter === 'low' && review.review_rating < 2) ||
                           (ratingFilter === review.review_rating.toString());

      return matchesSearch && matchesRating;
    });

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'rating_high':
          return b.review_rating - a.review_rating;
        case 'rating_low':
          return a.review_rating - b.review_rating;
        case 'client_name':
          return getClientName(a.id_client).localeCompare(getClientName(b.id_client));
        case 'venue_name':
          return getVenueName(a.id_venue).localeCompare(getVenueName(b.id_venue));
        default:
          return 0;
      }
    });

    setFilteredReviews(filtered);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Cliente no encontrado';
  };

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.venue_name : 'Lugar no encontrado';
  };

  // Reglas de negocio: Validar si se puede eliminar una reseña
  const canDeleteReview = (review) => {
    // Solo superadmin puede eliminar reseñas con calificación alta (4-5 estrellas)
    if (review.review_rating >= 4 && !hasRole(['superadmin'])) {
      return { allowed: false, reason: 'Solo el superadmin puede eliminar reseñas positivas' };
    }

    // Verificar si la reseña es muy antigua (más de 30 días)
    const reviewDate = new Date(review.created_at);
    const daysDiff = (new Date() - reviewDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30 && !hasRole(['superadmin'])) {
      return { allowed: false, reason: 'No se pueden eliminar reseñas de más de 30 días' };
    }

    // Admin puede eliminar reseñas problemáticas (1-2 estrellas) o recientes
    if (hasRole(['admin', 'superadmin'])) {
      return { allowed: true, reason: 'Permitido' };
    }

    return { allowed: false, reason: 'Sin permisos suficientes' };
  };

  // Regla de negocio: Validar si se puede editar una reseña
  const canEditReview = (review) => {
    const reviewDate = new Date(review.created_at);
    const daysDiff = (new Date() - reviewDate) / (1000 * 60 * 60 * 24);

    // Solo se pueden editar reseñas de menos de 7 días
    if (daysDiff > 7 && !hasRole(['superadmin'])) {
      return { allowed: false, reason: 'Solo se pueden editar reseñas de menos de 7 días' };
    }

    if (hasRole(['admin', 'superadmin'])) {
      return { allowed: true, reason: 'Permitido' };
    }

    return { allowed: false, reason: 'Sin permisos suficientes' };
  };

  const handleDelete = async () => {
    const deleteValidation = canDeleteReview(deleteDialog.review);
    
    if (!deleteValidation.allowed) {
      alert(`No se puede eliminar: ${deleteValidation.reason}`);
      setDeleteDialog({ open: false, review: null });
      return;
    }

    try {
      await reviewsAPI.delete(deleteDialog.review.id);
      setDeleteDialog({ open: false, review: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error al eliminar la reseña');
    }
  };

  const handleEdit = (review) => {
    const editValidation = canEditReview(review);
    
    if (!editValidation.allowed) {
      alert(`No se puede editar: ${editValidation.reason}`);
      return;
    }

    navigate(`/reviews/edit/${review.id}`);
  };

  const openDeleteDialog = (review) => {
    setDeleteDialog({ open: true, review });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, review: null });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'primary';
    if (rating >= 2) return 'warning';
    return 'error';
  };

  const getRatingIcon = (rating) => {
    if (rating >= 4) return <CheckCircle fontSize="small" />;
    if (rating >= 3) return <Info fontSize="small" />;
    if (rating >= 2) return <Warning fontSize="small" />;
    return <Error fontSize="small" />;
  };

  const getReviewAge = (createdAt) => {
    const reviewDate = new Date(createdAt);
    const daysDiff = Math.floor((new Date() - reviewDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return 'Ayer';
    if (daysDiff < 30) return `Hace ${daysDiff} días`;
    if (daysDiff < 365) return `Hace ${Math.floor(daysDiff / 30)} meses`;
    return `Hace ${Math.floor(daysDiff / 365)} años`;
  };

  // Analytics calculations
  const getAnalytics = () => {
    if (reviews.length === 0) return null;

    const avgRating = reviews.reduce((sum, review) => sum + review.review_rating, 0) / reviews.length;
    const ratingCounts = {
      5: reviews.filter(r => r.review_rating === 5).length,
      4: reviews.filter(r => r.review_rating === 4).length,
      3: reviews.filter(r => r.review_rating === 3).length,
      2: reviews.filter(r => r.review_rating === 2).length,
      1: reviews.filter(r => r.review_rating === 1).length,
    };

    const positiveReviews = reviews.filter(r => r.review_rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.review_rating <= 2).length;

    return {
      total: reviews.length,
      avgRating: avgRating.toFixed(1),
      ratingCounts,
      positivePercentage: ((positiveReviews / reviews.length) * 100).toFixed(1),
      negativePercentage: ((negativeReviews / reviews.length) * 100).toFixed(1),
    };
  };

  const analytics = getAnalytics();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando reseñas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Reseñas</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenu(e.currentTarget)}
          >
            Filtros
          </Button>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenu}
        open={Boolean(filterMenu)}
        onClose={() => setFilterMenu(null)}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Ordenar por:
        </Typography>
        <MenuItem onClick={() => { setSortBy('newest'); setFilterMenu(null); }}>
          Más recientes
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('oldest'); setFilterMenu(null); }}>
          Más antiguas
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('rating_high'); setFilterMenu(null); }}>
          Mayor calificación
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('rating_low'); setFilterMenu(null); }}>
          Menor calificación
        </MenuItem>
        <Divider />
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Filtrar por calificación:
        </Typography>
        <MenuItem onClick={() => { setRatingFilter('all'); setFilterMenu(null); }}>
          Todas las calificaciones
        </MenuItem>
        <MenuItem onClick={() => { setRatingFilter('high'); setFilterMenu(null); }}>
          Positivas (4-5 ⭐)
        </MenuItem>
        <MenuItem onClick={() => { setRatingFilter('medium'); setFilterMenu(null); }}>
          Neutras (2-3 ⭐)
        </MenuItem>
        <MenuItem onClick={() => { setRatingFilter('low'); setFilterMenu(null); }}>
          Negativas (1 ⭐)
        </MenuItem>
      </Menu>

      {/* Analytics Panel */}
      {analytics && showAnalytics && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          onClose={() => setShowAnalytics(false)}
        >
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Star color="primary" />
              <Typography variant="body2">
                <strong>Promedio: {analytics.avgRating} ⭐</strong>
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="success" />
              <Typography variant="body2">
                Positivas: {analytics.positivePercentage}%
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingDown color="error" />
              <Typography variant="body2">
                Negativas: {analytics.negativePercentage}%
              </Typography>
            </Box>
            <Typography variant="body2">
              Total: {analytics.total} reseñas
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Buscar reseñas por cliente, lugar o comentarios..."
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
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Calificación</InputLabel>
            <Select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              label="Calificación"
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="high">4-5 ⭐</MenuItem>
              <MenuItem value="medium">2-3 ⭐</MenuItem>
              <MenuItem value="low">1 ⭐</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Results Info */}
      {searchTerm || ratingFilter !== 'all' ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mostrando {filteredReviews.length} de {reviews.length} reseñas
        </Typography>
      ) : null}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            {reviews.length === 0 
              ? 'No hay reseñas registradas en el sistema' 
              : 'No se encontraron reseñas con los filtros aplicados'
            }
          </Typography>
          {searchTerm || ratingFilter !== 'all' ? (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setRatingFilter('all');
              }}
              sx={{ mt: 2 }}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredReviews.map((review) => {
            const editValidation = canEditReview(review);
            const deleteValidation = canDeleteReview(review);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={review.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Rating 
                          value={review.review_rating} 
                          readOnly 
                          size="small"
                        />
                        <Chip 
                          label={review.review_rating} 
                          size="small" 
                          variant="outlined"
                          color={getRatingColor(review.review_rating)}
                          icon={getRatingIcon(review.review_rating)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Box>
                        {hasRole(['admin', 'superadmin']) && (
                          <>
                            <Tooltip title={editValidation.allowed ? 'Editar reseña' : editValidation.reason}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(review)}
                                  color="primary"
                                  disabled={!editValidation.allowed}
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={deleteValidation.allowed ? 'Eliminar reseña' : deleteValidation.reason}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(review)}
                                  color="error"
                                  disabled={!deleteValidation.allowed}
                                >
                                  <Delete />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {getClientName(review.id_client)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {getVenueName(review.id_venue)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        {getReviewAge(review.created_at)}
                      </Typography>
                    </Box>
                    
                    {review.review_comments && (
                      <Box display="flex" alignItems="flex-start">
                        <Comment sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          "{review.review_comments.length > 150 
                            ? `${review.review_comments.substring(0, 150)}...` 
                            : review.review_comments}"
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar esta reseña? Esta acción no se puede deshacer.
          </DialogContentText>
          {deleteDialog.review && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Cliente:</strong> {getClientName(deleteDialog.review.id_client)}
              </Typography>
              <Typography variant="body2">
                <strong>Lugar:</strong> {getVenueName(deleteDialog.review.id_venue)}
              </Typography>
              <Typography variant="body2">
                <strong>Calificación:</strong> {deleteDialog.review.review_rating} ⭐
              </Typography>
            </Box>
          )}
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

export default ReviewList;