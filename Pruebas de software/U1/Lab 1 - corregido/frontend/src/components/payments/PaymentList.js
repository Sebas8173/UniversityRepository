// src/components/payments/PaymentList.js
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
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Payment,
  EventNote,
  AttachMoney,
  CalendarToday,
  FilterList,
  Warning,
  CheckCircle,
  Error,
  Pending,
  History,
  AccountBalance,
  Receipt,
  TrendingUp,
  Info,
  Block,
  SecurityUpdateGood,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { paymentsAPI, reservationsAPI, clientsAPI } from '../../services/api';
import { hasRole } from '../../utils/auth';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, payment: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterMenu, setFilterMenu] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, reservations, clients, searchTerm, statusFilter, amountFilter, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, reservationsRes, clientsRes] = await Promise.all([
        paymentsAPI.getAll(),
        reservationsAPI.getAll(),
        clientsAPI.getAll(),
      ]);
      
      setPayments(paymentsRes.data || []);
      setReservations(reservationsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = payments.filter(payment => {
      const reservation = reservations.find(r => r.id === payment.id_reservation);
      const client = reservation ? clients.find(c => c.id === reservation.id_client) : null;
      const clientName = client ? `${client.first_name} ${client.last_name}` : '';
      
      // Filtro de texto
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.payment_amount?.toString().includes(searchTerm) ||
                           payment.payment_date?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de estado
      const paymentStatus = getPaymentStatus(payment);
      const matchesStatus = statusFilter === 'all' || paymentStatus.status === statusFilter;

      // Filtro de monto
      const amount = payment.payment_amount;
      const matchesAmount = amountFilter === 'all' ||
                            (amountFilter === 'low' && amount < 100) ||
                            (amountFilter === 'medium' && amount >= 100 && amount < 500) ||
                            (amountFilter === 'high' && amount >= 500);

      return matchesSearch && matchesStatus && matchesAmount;
    });

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.payment_date) - new Date(a.payment_date);
        case 'oldest':
          return new Date(a.payment_date) - new Date(b.payment_date);
        case 'amount_high':
          return b.payment_amount - a.payment_amount;
        case 'amount_low':
          return a.payment_amount - b.payment_amount;
        case 'client_name':
          const clientA = getReservationInfo(a.id_reservation).clientName;
          const clientB = getReservationInfo(b.id_reservation).clientName;
          return clientA.localeCompare(clientB);
        default:
          return 0;
      }
    });

    setFilteredPayments(filtered);
  };

  // Regla de negocio: Determinar estado del pago basado en fechas y contexto
  const getPaymentStatus = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysDiff = Math.floor((today - paymentDate) / (1000 * 60 * 60 * 24));
    
    // Verificar si el pago es del futuro (programado)
    if (paymentDate > today) {
      return { 
        status: 'scheduled', 
        label: 'Programado', 
        color: 'info',
        icon: <Pending />
      };
    }
    
    // Pago reciente (menos de 24 horas)
    if (daysDiff === 0) {
      return { 
        status: 'recent', 
        label: 'Reciente', 
        color: 'success',
        icon: <CheckCircle />
      };
    }
    
    // Pago procesado (1-7 días)
    if (daysDiff <= 7) {
      return { 
        status: 'processed', 
        label: 'Procesado', 
        color: 'success',
        icon: <SecurityUpdateGood />
      };
    }
    
    // Pago consolidado (más de 7 días)
    return { 
      status: 'consolidated', 
      label: 'Consolidado', 
      color: 'primary',
      icon: <AccountBalance />
    };
  };

  // Regla de negocio: Validar si se puede editar un pago
  const canEditPayment = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysDiff = Math.floor((today - paymentDate) / (1000 * 60 * 60 * 24));
    
    // Superadmin puede editar cualquier pago
    if (hasRole(['superadmin'])) {
      return { allowed: true, reason: 'Superadmin: acceso completo' };
    }
    
    // Admin puede editar pagos de menos de 7 días
    if (hasRole(['admin']) && daysDiff <= 7) {
      return { allowed: true, reason: 'Pago reciente, edición permitida' };
    }
    
    // No se pueden editar pagos consolidados (más de 7 días)
    if (daysDiff > 7) {
      return { 
        allowed: false, 
        reason: 'Pago consolidado, no se puede editar después de 7 días' 
      };
    }
    
    // Pagos del futuro solo editables por admin+
    if (paymentDate > today && !hasRole(['admin', 'superadmin'])) {
      return { 
        allowed: false, 
        reason: 'Sin permisos para editar pagos programados' 
      };
    }
    
    return { allowed: false, reason: 'Sin permisos suficientes' };
  };

  // Regla de negocio: Validar si se puede eliminar un pago
  const canDeletePayment = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysDiff = Math.floor((today - paymentDate) / (1000 * 60 * 60 * 24));
    
    // Solo superadmin puede eliminar pagos consolidados
    if (daysDiff > 7 && !hasRole(['superadmin'])) {
      return { 
        allowed: false, 
        reason: 'Solo superadmin puede eliminar pagos consolidados' 
      };
    }
    
    // No se pueden eliminar pagos de alto valor (>$1000) sin ser superadmin
    if (payment.payment_amount > 1000 && !hasRole(['superadmin'])) {
      return { 
        allowed: false, 
        reason: 'Solo superadmin puede eliminar pagos superiores a $1,000' 
      };
    }
    
    // Admin puede eliminar pagos recientes de menor valor
    if (hasRole(['admin', 'superadmin'])) {
      return { allowed: true, reason: 'Permisos administrativos' };
    }
    
    return { allowed: false, reason: 'Sin permisos suficientes' };
  };

  // Regla de negocio: Detectar pagos que requieren atención
  const getPaymentAlerts = (payment) => {
    const alerts = [];
    const amount = payment.payment_amount;
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    
    // Pago de alto valor
    if (amount > 1000) {
      alerts.push({ type: 'high_value', message: 'Pago de alto valor', severity: 'warning' });
    }
    
    // Pago duplicado potencial (mismo cliente, mismo día, monto similar)
    const sameDayPayments = payments.filter(p => 
      p.id !== payment.id &&
      p.payment_date === payment.payment_date &&
      getReservationInfo(p.id_reservation).clientName === getReservationInfo(payment.id_reservation).clientName &&
      Math.abs(p.payment_amount - amount) < 10
    );
    
    if (sameDayPayments.length > 0) {
      alerts.push({ type: 'duplicate', message: 'Posible duplicado', severity: 'error' });
    }
    
    // Pago futuro
    if (paymentDate > today) {
      alerts.push({ type: 'future', message: 'Pago programado', severity: 'info' });
    }
    
    return alerts;
  };

  const handleDelete = async () => {
    const deleteValidation = canDeletePayment(deleteDialog.payment);
    
    if (!deleteValidation.allowed) {
      alert(`No se puede eliminar: ${deleteValidation.reason}`);
      setDeleteDialog({ open: false, payment: null });
      return;
    }

    try {
      await paymentsAPI.delete(deleteDialog.payment.id);
      setDeleteDialog({ open: false, payment: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error al eliminar el pago');
    }
  };

  const handleEdit = (payment) => {
    const editValidation = canEditPayment(payment);
    
    if (!editValidation.allowed) {
      alert(`No se puede editar: ${editValidation.reason}`);
      return;
    }

    navigate(`/payments/edit/${payment.id}`);
  };

  const openDeleteDialog = (payment) => {
    setDeleteDialog({ open: true, payment });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, payment: null });
  };

  const getReservationInfo = (reservationId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return { clientName: 'Reservación no encontrada', reservationDate: '', reservationId };
    
    const client = clients.find(c => c.id === reservation.id_client);
    const clientName = client ? `${client.first_name} ${client.last_name}` : 'Cliente no encontrado';
    
    return {
      clientName,
      reservationDate: reservation.reservation_date,
      reservationId: reservation.id
    };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getPaymentAge = (paymentDate) => {
    const date = new Date(paymentDate);
    const today = new Date();
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    if (date > today) return `En ${Math.abs(daysDiff)} días`;
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return 'Ayer';
    if (daysDiff < 30) return `Hace ${daysDiff} días`;
    if (daysDiff < 365) return `Hace ${Math.floor(daysDiff / 30)} meses`;
    return `Hace ${Math.floor(daysDiff / 365)} años`;
  };

  // Cálculos de analytics
  const getAnalytics = () => {
    if (payments.length === 0) return null;

    const totalAmount = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    const avgPayment = totalAmount / payments.length;
    const highValuePayments = payments.filter(p => p.payment_amount > 500).length;
    
    const statusCounts = {
      recent: 0,
      processed: 0,
      consolidated: 0,
      scheduled: 0
    };
    
    payments.forEach(payment => {
      const status = getPaymentStatus(payment).status;
      statusCounts[status]++;
    });

    return {
      total: payments.length,
      totalAmount,
      avgPayment,
      highValuePayments,
      statusCounts
    };
  };

  const analytics = getAnalytics();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando pagos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Pagos</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenu(e.currentTarget)}
          >
            Filtros
          </Button>
          {hasRole(['admin', 'superadmin']) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/payments/new')}
            >
              Nuevo Pago
            </Button>
          )}
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
          Más antiguos
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('amount_high'); setFilterMenu(null); }}>
          Mayor monto
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('amount_low'); setFilterMenu(null); }}>
          Menor monto
        </MenuItem>
        <Divider />
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Filtrar por estado:
        </Typography>
        <MenuItem onClick={() => { setStatusFilter('all'); setFilterMenu(null); }}>
          Todos los estados
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('recent'); setFilterMenu(null); }}>
          Recientes
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('processed'); setFilterMenu(null); }}>
          Procesados
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('consolidated'); setFilterMenu(null); }}>
          Consolidados
        </MenuItem>
        <MenuItem onClick={() => { setStatusFilter('scheduled'); setFilterMenu(null); }}>
          Programados
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
              <Receipt color="primary" />
              <Typography variant="body2">
                <strong>Total: {formatPrice(analytics.totalAmount)}</strong>
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="success" />
              <Typography variant="body2">
                Promedio: {formatPrice(analytics.avgPayment)}
              </Typography>
            </Box>
            <Typography variant="body2">
              Pagos: {analytics.total} | Alto valor: {analytics.highValuePayments}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Buscar pagos por cliente, monto o fecha..."
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
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="recent">Recientes</MenuItem>
              <MenuItem value="processed">Procesados</MenuItem>
              <MenuItem value="consolidated">Consolidados</MenuItem>
              <MenuItem value="scheduled">Programados</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Monto</InputLabel>
            <Select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              label="Monto"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="low">&lt; $100</MenuItem>
              <MenuItem value="medium">$100-500</MenuItem>
              <MenuItem value="high">&gt; $500</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Results Info */}
      {searchTerm || statusFilter !== 'all' || amountFilter !== 'all' ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mostrando {filteredPayments.length} de {payments.length} pagos
        </Typography>
      ) : null}

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            {payments.length === 0 
              ? 'No hay pagos registrados en el sistema' 
              : 'No se encontraron pagos con los filtros aplicados'
            }
          </Typography>
          {(searchTerm || statusFilter !== 'all' || amountFilter !== 'all') ? (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setAmountFilter('all');
              }}
              sx={{ mt: 2 }}
            >
              Limpiar filtros
            </Button>
          ) : hasRole(['admin', 'superadmin']) && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => navigate('/payments/new')}
              sx={{ mt: 2 }}
            >
              Crear primer pago
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredPayments.map((payment) => {
            const reservationInfo = getReservationInfo(payment.id_reservation);
            const paymentStatus = getPaymentStatus(payment);
            const editValidation = canEditPayment(payment);
            const deleteValidation = canDeletePayment(payment);
            const alerts = getPaymentAlerts(payment);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={payment.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" component="div">
                          Pago #{payment.id}
                        </Typography>
                        {alerts.length > 0 && (
                          <Badge badgeContent={alerts.length} color="warning">
                            <Warning fontSize="small" color="warning" />
                          </Badge>
                        )}
                      </Box>
                      <Box>
                        {hasRole(['admin', 'superadmin']) && (
                          <>
                            <Tooltip title={editValidation.allowed ? 'Editar pago' : editValidation.reason}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(payment)}
                                  color="primary"
                                  disabled={!editValidation.allowed}
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={deleteValidation.allowed ? 'Eliminar pago' : deleteValidation.reason}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(payment)}
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

                    {/* Alertas */}
                    {alerts.length > 0 && (
                      <Box mb={2}>
                        {alerts.map((alert, index) => (
                          <Chip
                            key={index}
                            label={alert.message}
                            size="small"
                            color={alert.severity}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <EventNote sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Reservación #{reservationInfo.reservationId}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente: {reservationInfo.clientName}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(payment.payment_date)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        {getPaymentAge(payment.payment_date)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="h6" color="primary">
                          {formatPrice(payment.payment_amount)}
                        </Typography>
                      </Box>
                      <Chip
                        label={paymentStatus.label}
                        color={paymentStatus.color}
                        size="small"
                        icon={paymentStatus.icon}
                      />
                    </Box>
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
            ¿Está seguro que desea eliminar el pago #{deleteDialog.payment?.id}?
            Esta acción no se puede deshacer.
          </DialogContentText>
          {deleteDialog.payment && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Cliente:</strong> {getReservationInfo(deleteDialog.payment.id_reservation).clientName}
              </Typography>
              <Typography variant="body2">
                <strong>Monto:</strong> {formatPrice(deleteDialog.payment.payment_amount)}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formatDate(deleteDialog.payment.payment_date)}
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

export default PaymentList;