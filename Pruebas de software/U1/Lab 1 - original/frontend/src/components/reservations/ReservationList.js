// src/components/reservations/ReservationList.js
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
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Fab,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  Search,
  Event,
  People,
  Restaurant,
  AccessTime,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Cancel,
  Schedule,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reservationsAPI, clientsAPI, menusAPI } from '../../services/api';
import { hasRole, getCurrentUser } from '../../utils/auth';
import RoleBasedActions from '../common/RoleBasedActions';

// REGLAS DE NEGOCIO FUNCIONALES
const BUSINESS_RULES = {
  // Tiempo mínimo para cancelación (24 horas)
  CANCELLATION_DEADLINE_HOURS: 24,
  // Tiempo para considerar una reservación como "próxima" (2 horas)
  UPCOMING_THRESHOLD_HOURS: 2,
  // Tiempo después del cual una reservación se considera "perdida" (30 minutos)
  NO_SHOW_THRESHOLD_MINUTES: 30,
  // Capacidad máxima por reservación
  MAX_GUESTS_PER_RESERVATION: 20,
  // Horario de operación del restaurante
  RESTAURANT_HOURS: {
    OPEN: '11:00',
    CLOSE: '22:00',
    LAST_RESERVATION: '21:00'
  }
};

// Estados de reservación
const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  COMPLETED: 'completed'
};

const STATUS_CONFIG = {
  [RESERVATION_STATUS.CONFIRMED]: {
    label: 'Confirmada',
    color: 'success',
    icon: CheckCircle
  },
  [RESERVATION_STATUS.PENDING]: {
    label: 'Pendiente',
    color: 'warning',
    icon: Schedule
  },
  [RESERVATION_STATUS.CANCELLED]: {
    label: 'Cancelada',
    color: 'error',
    icon: Cancel
  },
  [RESERVATION_STATUS.NO_SHOW]: {
    label: 'No se presentó',
    color: 'error',
    icon: Warning
  },
  [RESERVATION_STATUS.COMPLETED]: {
    label: 'Completada',
    color: 'info',
    icon: CheckCircle
  }
};

function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, reservation: null });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nuevos estados para filtros y reglas de negocio
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, upcoming, past
  const [alerts, setAlerts] = useState([]);
  
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchData();
    // Configurar actualización automática cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
    checkBusinessRules();
  }, [reservations, clients, searchTerm, statusFilter, dateFilter]);

  // REGLA DE NEGOCIO: Determinar el estado de una reservación basado en fecha/hora
  const determineReservationStatus = (reservation) => {
    if (reservation.status) {
      return reservation.status;
    }

    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const diffMinutes = (now - reservationDateTime) / (1000 * 60);

    // Si pasaron más de 30 minutos y no se marcó como completada, es "no show"
    if (diffMinutes > BUSINESS_RULES.NO_SHOW_THRESHOLD_MINUTES) {
      return RESERVATION_STATUS.NO_SHOW;
    }

    // Si es en el futuro, está confirmada (o pendiente según lógica del negocio)
    if (reservationDateTime > now) {
      return RESERVATION_STATUS.CONFIRMED;
    }

    // Si está en curso (dentro de los 30 minutos de tolerancia)
    return RESERVATION_STATUS.PENDING;
  };

  // REGLA DE NEGOCIO: Verificar si una reservación puede ser cancelada
  const canCancelReservation = (reservation) => {
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const diffHours = (reservationDateTime - now) / (1000 * 60 * 60);
    
    return diffHours >= BUSINESS_RULES.CANCELLATION_DEADLINE_HOURS && 
           ![RESERVATION_STATUS.CANCELLED, RESERVATION_STATUS.COMPLETED].includes(reservation.status);
  };

  // REGLA DE NEGOCIO: Verificar si una reservación es próxima (necesita atención)
  const isUpcomingReservation = (reservation) => {
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const diffHours = (reservationDateTime - now) / (1000 * 60 * 60);
    
    return diffHours > 0 && diffHours <= BUSINESS_RULES.UPCOMING_THRESHOLD_HOURS;
  };

  // REGLA DE NEGOCIO: Validar capacidad y horarios
  const validateReservationRules = (reservation) => {
    const issues = [];
    
    // Validar número de invitados
    if (reservation.number_of_guests > BUSINESS_RULES.MAX_GUESTS_PER_RESERVATION) {
      issues.push(`Excede capacidad máxima (${BUSINESS_RULES.MAX_GUESTS_PER_RESERVATION} personas)`);
    }
    
    // Validar horario
    const reservationTime = reservation.reservation_time;
    if (reservationTime < BUSINESS_RULES.RESTAURANT_HOURS.OPEN || 
        reservationTime > BUSINESS_RULES.RESTAURANT_HOURS.LAST_RESERVATION) {
      issues.push(`Fuera del horario de atención (${BUSINESS_RULES.RESTAURANT_HOURS.OPEN} - ${BUSINESS_RULES.RESTAURANT_HOURS.LAST_RESERVATION})`);
    }
    
    return issues;
  };

  // REGLA DE NEGOCIO: Verificar alertas del sistema
  const checkBusinessRules = () => {
    const newAlerts = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Alertas por reservaciones próximas
    const upcomingReservations = reservations.filter(isUpcomingReservation);
    if (upcomingReservations.length > 0) {
      newAlerts.push({
        type: 'info',
        message: `Tienes ${upcomingReservations.length} reservación(es) en las próximas 2 horas`
      });
    }
    
    // Alertas por posibles "no shows"
    const possibleNoShows = reservations.filter(r => {
      const status = determineReservationStatus(r);
      return status === RESERVATION_STATUS.NO_SHOW && r.reservation_date === today;
    });
    
    if (possibleNoShows.length > 0) {
      newAlerts.push({
        type: 'warning',
        message: `${possibleNoShows.length} reservación(es) no se presentaron hoy`
      });
    }
    
    setAlerts(newAlerts);
  };

  const applyFilters = () => {
    let filtered = reservations.filter(reservation => {
      if (!reservation) return false;
      
      // Filtro de búsqueda existente
      const client = clients.find(c => {
        if (!c || reservation.id_client == null) return false;
        return c.id === reservation.id_client || 
               c.id?.toString() === reservation.id_client?.toString() ||
               c.id_client === reservation.id_client || 
               c.id_client?.toString() === reservation.id_client?.toString();
      });
      
      const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}` : '';
      const matchesSearch = searchTerm === '' || 
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reservation.reservation_date && reservation.reservation_date.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (reservation.number_of_guests && reservation.number_of_guests.toString().includes(searchTerm));
      
      if (!matchesSearch) return false;
      
      // Filtro por estado
      if (statusFilter !== 'all') {
        const reservationStatus = determineReservationStatus(reservation);
        if (reservationStatus !== statusFilter) return false;
      }
      
      // Filtro por fecha
      const today = new Date().toISOString().split('T')[0];
      const reservationDate = reservation.reservation_date;
      
      switch (dateFilter) {
        case 'today':
          if (reservationDate !== today) return false;
          break;
        case 'upcoming':
          if (new Date(reservationDate) <= new Date(today)) return false;
          break;
        case 'past':
          if (new Date(reservationDate) >= new Date(today)) return false;
          break;
      }
      
      return true;
    });
    
    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.reservation_date}T${a.reservation_time}`);
      const dateB = new Date(`${b.reservation_date}T${b.reservation_time}`);
      return dateB - dateA; // Más recientes primero
    });
    
    setFilteredReservations(filtered);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reservationsRes, clientsRes, menusRes] = await Promise.all([
        reservationsAPI.getAll(),
        clientsAPI.getAll(),
        menusAPI.getAll()
      ]);
      
      const reservationsData = Array.isArray(reservationsRes.data) ? reservationsRes.data : 
                              Array.isArray(reservationsRes) ? reservationsRes : [];
      const clientsData = Array.isArray(clientsRes.data) ? clientsRes.data : 
                         Array.isArray(clientsRes) ? clientsRes : [];
      const menusData = Array.isArray(menusRes.data) ? menusRes.data : 
                       Array.isArray(menusRes) ? menusRes : [];
      
      setReservations(reservationsData);
      setClients(clientsData);
      setMenus(menusData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await reservationsAPI.update(reservationId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await reservationsAPI.delete(deleteDialog.reservation.id);
      setDeleteDialog({ open: false, reservation: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  };

  const openDeleteDialog = (reservation) => {
    setDeleteDialog({ open: true, reservation });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, reservation: null });
  };

  const getClientName = (clientId) => {
    if (clientId == null) return 'Cliente sin ID';
    
    let client = clients.find(c => {
      if (c?.id == null) return false;
      if (c.id === clientId || c.id.toString() === clientId.toString()) return true;
      const cIdNum = parseInt(c.id);
      const clientIdNum = parseInt(clientId);
      return !isNaN(cIdNum) && !isNaN(clientIdNum) && cIdNum === clientIdNum;
    });
    
    if (!client) {
      client = clients.find(c => {
        if (c?.id_client == null) return false;
        if (c.id_client === clientId || c.id_client.toString() === clientId.toString()) return true;
        const cIdClientNum = parseInt(c.id_client);
        const clientIdNum = parseInt(clientId);
        return !isNaN(cIdClientNum) && !isNaN(clientIdNum) && cIdClientNum === clientIdNum;
      });
    }
    
    return client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 
           `Cliente no encontrado (ID: ${clientId})`;
  };

  const getMenuName = (menuId) => {
    if (menuId == null) return 'Sin menú asignado';
    
    const menu = menus.find(m => {
      if (m?.id == null) return false;
      return m.id === menuId || m.id.toString() === menuId.toString() ||
             (!isNaN(parseInt(m.id)) && !isNaN(parseInt(menuId)) && 
              parseInt(m.id) === parseInt(menuId));
    });
    
    return menu ? menu.menu_name : `Menú no encontrado (ID: ${menuId})`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Hora no disponible';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando reservaciones...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchData}>
          Reintentar
        </Button>
      </Box>
    );
  }

  // Estadísticas rápidas
  const stats = {
    total: reservations.length,
    today: reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).length,
    upcoming: reservations.filter(isUpcomingReservation).length,
    confirmed: reservations.filter(r => determineReservationStatus(r) === RESERVATION_STATUS.CONFIRMED).length
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Reservaciones</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/reservations/new')}
        >
          Nueva Reservación
        </Button>
      </Box>

      {/* Alertas del sistema */}
      {alerts.map((alert, index) => (
        <Alert key={index} severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      ))}

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.total}</Typography>
            <Typography variant="caption">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.today}</Typography>
            <Typography variant="caption">Hoy</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Badge badgeContent={stats.upcoming} color="warning">
              <Typography variant="h6">{stats.upcoming}</Typography>
            </Badge>
            <Typography variant="caption">Próximas</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.confirmed}</Typography>
            <Typography variant="caption">Confirmadas</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros mejorados */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar reservaciones por cliente, fecha o número de invitados..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <MenuItem key={status} value={status}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Fecha</InputLabel>
              <Select
                value={dateFilter}
                label="Fecha"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="upcoming">Próximas</MenuItem>
                <MenuItem value="past">Pasadas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {filteredReservations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            {reservations.length === 0 
              ? "No hay reservaciones registradas" 
              : "No se encontraron reservaciones con esos criterios"
            }
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/reservations/new')}
            sx={{ mt: 2 }}
          >
            {reservations.length === 0 ? "Crear primera reservación" : "Nueva Reservación"}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredReservations.map((reservation) => {
            const status = determineReservationStatus(reservation);
            const statusConfig = STATUS_CONFIG[status];
            const canCancel = canCancelReservation(reservation);
            const isUpcoming = isUpcomingReservation(reservation);
            const validationIssues = validateReservationRules(reservation);
            const StatusIcon = statusConfig.icon;

            return (
              <Grid item xs={12} md={6} lg={4} key={reservation.id}>
                <Card sx={{ 
                  border: isUpcoming ? '2px solid #ff9800' : 'none',
                  boxShadow: isUpcoming ? 3 : 1
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div">
                        Reservación #{reservation.id}
                        {isUpcoming && (
                          <Tooltip title="Reservación próxima">
                            <Warning sx={{ ml: 1, color: 'orange', fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/reservations/edit/${reservation.id}`)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        {canCancel && (
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(reservation)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Estado de la reservación */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <StatusIcon sx={{ fontSize: 16, mr: 1, color: statusConfig.color + '.main' }} />
                      <Chip
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                      />
                      {status === RESERVATION_STATUS.PENDING && (
                        <Box sx={{ ml: 1 }}>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.CONFIRMED)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.NO_SHOW)}
                          >
                            No Show
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {getClientName(reservation.id_client)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <Event sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(reservation.reservation_date)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(reservation.reservation_time)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={2}>
                      <Restaurant sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {getMenuName(reservation.menu_id)}
                      </Typography>
                    </Box>
                    
                    {/* Validaciones y alertas */}
                    {validationIssues.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem' }}>
                        {validationIssues.join(', ')}
                      </Alert>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={`${reservation.number_of_guests || 0} invitados`}
                        color={reservation.number_of_guests > BUSINESS_RULES.MAX_GUESTS_PER_RESERVATION ? 'error' : 'primary'}
                        size="small"
                      />
                      {!canCancel && status !== RESERVATION_STATUS.COMPLETED && (
                        <Tooltip title="No se puede cancelar (menos de 24h)">
                          <Chip
                            label="No cancelable"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar cancelación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea cancelar la reservación #{deleteDialog.reservation?.id}?
            {deleteDialog.reservation && canCancelReservation(deleteDialog.reservation) 
              ? " Esta acción se puede realizar porque faltan más de 24 horas."
              : " ADVERTENCIA: Esta reservación no cumple con la política de cancelación de 24 horas."
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Confirmar Cancelación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReservationList;