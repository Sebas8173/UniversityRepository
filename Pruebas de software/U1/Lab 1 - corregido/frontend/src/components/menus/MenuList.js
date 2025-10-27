// src/components/menus/MenuList.js
import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Restaurant,
  AttachMoney,
  Warning,
  Schedule,
  TrendingUp,
  Inventory,
  Security,
  LocalOffer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { menusAPI } from '../../services/api';

// Constantes iniciales de configuración
const INITIAL_BUSINESS_RULES = {
  HAPPY_HOUR: { start: 15, end: 18, discount: 0.15 },
  BREAKFAST_CUTOFF: 11,
  LUNCH_CUTOFF: 16,
  DINNER_START: 18,
  MIN_PROFIT_MARGIN: 0.30,
  LOW_STOCK_THRESHOLD: 5,
};

const MENU_STATUS = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
  SEASONAL: 'seasonal',
  PREPARING: 'preparing',
  LOW_STOCK: 'low_stock',
};

const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
};

function MenuList() {
  // Estados principales
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, menu: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Filtros y configuraciones
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priceRange: 'all',
    onlyAvailable: false,
    showOutOfStock: true,
  });
  
  // Configuración del usuario (simularemos diferentes roles)
  const [userConfig, setUserConfig] = useState({
    role: USER_ROLES.ADMIN, // Cambiar para probar diferentes roles
    userId: 'user123',
    showBusinessMetrics: true,
    autoRefresh: true,
  });

  // Reglas de negocio ahora son editables y persistentes
  const [businessRules, setBusinessRules] = useState(INITIAL_BUSINESS_RULES);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempRules, setTempRules] = useState(INITIAL_BUSINESS_RULES);

  const navigate = useNavigate();

  // Cargar reglas de negocio desde localStorage al montar
  useEffect(() => {
    const savedRules = localStorage.getItem('businessRules');
    if (savedRules) {
      try {
        const parsed = JSON.parse(savedRules);
        setBusinessRules(parsed);
        setTempRules(parsed);
      } catch (error) {
        console.error('Error loading business rules:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchMenus();
    
    // Auto-refresh cada 30 segundos si está habilitado
    if (userConfig.autoRefresh) {
      const interval = setInterval(fetchMenus, 30000);
      return () => clearInterval(interval);
    }
  }, [userConfig.autoRefresh]);

  useEffect(() => {
    applyFilters();
  }, [menus, searchTerm, filters, businessRules]); // Agregamos businessRules como dependencia para re-aplicar filtros si cambian

  // Fetch de menús con enriquecimiento determinístico para coherencia
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.getAll();
      
      // Enriquecemos los datos de manera determinística (basado en ID) para coherencia
      const enrichedMenus = (response.data || []).map(menu => ({
        ...menu,
        // Datos adicionales determinísticos si no existen
        stock_level: menu.stock_level ?? ((menu.id * 7) % 20 + 1),
        min_stock: menu.min_stock ?? 5,
        cost: menu.cost ?? (menu.menu_price * (0.3 + ((menu.id % 10) / 20))),
        popularity: menu.popularity ?? (50 + ((menu.id * 13) % 50)),
        category: menu.category ?? ['desayuno', 'almuerzo', 'cena', 'bebida'][menu.id % 4],
        created_by: menu.created_by ?? (menu.id % 2 === 0 ? userConfig.userId : 'other_user'),
        active_orders: menu.active_orders ?? (menu.id % 5),
        seasonal: menu.seasonal ?? (menu.id % 5 === 0),
        season: menu.season ?? ['spring', 'summer', 'fall', 'winter'][menu.id % 4],
        last_ordered: menu.last_ordered ?? new Date(Date.now() - (menu.id * 86400000)), // Diferentes días basados en ID
      }));
      
      setMenus(enrichedMenus);
    } catch (error) {
      console.error('Error fetching menus:', error);
      setMenus([]);
      showSnackbar('Error al cargar menús', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en las reglas temporales
  const handleRuleChange = (field) => (e) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;

    if (field.startsWith('HAPPY_HOUR.')) {
      const key = field.split('.')[1];
      setTempRules(prev => ({
        ...prev,
        HAPPY_HOUR: {
          ...prev.HAPPY_HOUR,
          [key]: value,
        },
      }));
    } else {
      setTempRules(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Guardar cambios en las reglas
  const saveBusinessRules = () => {
    setBusinessRules(tempRules);
    localStorage.setItem('businessRules', JSON.stringify(tempRules));
    setSettingsOpen(false);
    showSnackbar('Reglas de negocio actualizadas', 'success');
    // Re-fetch o re-aplicar filtros si es necesario
    fetchMenus();
  };

  // Abrir configuración de reglas
  const openSettings = () => {
    setTempRules(JSON.parse(JSON.stringify(businessRules))); // Copia profunda
    setSettingsOpen(true);
  };

  // Regla de Negocio 1: Gestión de Estado de Disponibilidad
  const getMenuStatus = (menu) => {
    if (menu.stock_level === 0) {
      return { 
        status: MENU_STATUS.OUT_OF_STOCK, 
        label: 'Agotado', 
        color: 'error',
        icon: <Inventory />
      };
    }
    
    if (menu.stock_level <= businessRules.LOW_STOCK_THRESHOLD) {
      return { 
        status: MENU_STATUS.LOW_STOCK, 
        label: `Stock Bajo (${menu.stock_level})`, 
        color: 'warning',
        icon: <Warning />
      };
    }
    
    if (!isMenuAvailable(menu)) {
      return { 
        status: MENU_STATUS.SEASONAL, 
        label: 'No disponible', 
        color: 'default',
        icon: <Schedule />
      };
    }
    
    return { 
      status: MENU_STATUS.AVAILABLE, 
      label: 'Disponible', 
      color: 'success',
      icon: <Restaurant />
    };
  };

  // Regla de Negocio 2: Validación de Horarios
  const isMenuAvailable = (menu) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Verificar horarios por categoría
    if (menu.category === 'desayuno' && currentHour > businessRules.BREAKFAST_CUTOFF) {
      return false;
    }
    
    if (menu.category === 'almuerzo' && (currentHour < 11 || currentHour > businessRules.LUNCH_CUTOFF)) {
      return false;
    }
    
    if (menu.category === 'cena' && currentHour < businessRules.DINNER_START) {
      return false;
    }
    
    // Verificar disponibilidad estacional
    if (menu.seasonal && !isSeasonallyAvailable(menu)) {
      return false;
    }
    
    return true;
  };

  // Regla de Negocio 3: Precios Dinámicos
  const calculateDynamicPrice = (menu) => {
    let price = menu.menu_price;
    const now = new Date();
    const currentHour = now.getHours();
    
    // Happy Hour
    if (currentHour >= businessRules.HAPPY_HOUR.start && 
        currentHour <= businessRules.HAPPY_HOUR.end) {
      price *= (1 - businessRules.HAPPY_HOUR.discount);
    }
    
    // Descuento por stock alto (liquidación)
    if (menu.stock_level > 15) {
      price *= 0.9; // 10% descuento (esta regla podría hacerse editable también, pero por ahora fija)
    }
    
    return price;
  };

  // Regla de Negocio 4: Control de Permisos por Rol
  const canPerformAction = (action, menu = null) => {
    const { role, userId } = userConfig;
    
    switch (action) {
      case 'delete':
        if (role === USER_ROLES.ADMIN) return true;
        if (role === USER_ROLES.MANAGER && menu?.created_by === userId) return true;
        return false;
        
      case 'edit':
        if (role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER) return true;
        if (role === USER_ROLES.STAFF && menu?.created_by === userId) return true;
        return false;
        
      case 'create':
        return role !== USER_ROLES.VIEWER;
        
      case 'view_metrics':
        return role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;
        
      case 'edit_rules':
        return role === USER_ROLES.ADMIN;
        
      default:
        return false;
    }
  };

  // Regla de Negocio 5: Validación antes de Eliminar
  const validateDeletion = async (menu) => {
    const validations = [];
    
    // Verificar órdenes activas
    if (menu.active_orders > 0) {
      validations.push({
        type: 'error',
        message: `El menú tiene ${menu.active_orders} órdenes activas`
      });
    }
    
    // Verificar si es muy popular
    if (menu.popularity > 80) {
      validations.push({
        type: 'warning',
        message: 'Este es un menú muy popular. ¿Está seguro?'
      });
    }
    
    // Verificar último de la categoría
    const categoryMenus = menus.filter(m => m.category === menu.category && m.id !== menu.id);
    if (categoryMenus.length === 0) {
      validations.push({
        type: 'warning',
        message: 'Este es el último menú de la categoría'
      });
    }
    
    return validations;
  };

  // Regla de Negocio 6: Validación de Precios
  const validateMenuPrice = (menu) => {
    const minimumPrice = menu.cost * (1 + businessRules.MIN_PROFIT_MARGIN);
    const currentMargin = (menu.menu_price - menu.cost) / menu.menu_price;
    
    return {
      isValid: currentMargin >= businessRules.MIN_PROFIT_MARGIN,
      minimumPrice,
      currentMargin: currentMargin * 100,
      message: currentMargin < businessRules.MIN_PROFIT_MARGIN 
        ? `Margen muy bajo (${(currentMargin * 100).toFixed(1)}%). Mínimo: ${(businessRules.MIN_PROFIT_MARGIN * 100)}%`
        : null
    };
  };

  // Regla de Negocio 7: Disponibilidad Estacional
  const isSeasonallyAvailable = (menu) => {
    if (!menu.seasonal) return true;
    
    const currentMonth = new Date().getMonth();
    const seasonMonths = {
      spring: [2, 3, 4], // Mar, Apr, May
      summer: [5, 6, 7], // Jun, Jul, Aug
      fall: [8, 9, 10],  // Sep, Oct, Nov
      winter: [11, 0, 1] // Dec, Jan, Feb
    };
    
    return seasonMonths[menu.season]?.includes(currentMonth) || false;
  };

  // Regla de Negocio 8: Ordenamiento Inteligente
  const sortMenusByBusinessLogic = (menuList) => {
    return [...menuList].sort((a, b) => {
      // Prioridad 1: Menús disponibles primero
      const aAvailable = isMenuAvailable(a) ? 1 : 0;
      const bAvailable = isMenuAvailable(b) ? 1 : 0;
      if (aAvailable !== bAvailable) return bAvailable - aAvailable;
      
      // Prioridad 2: Popularidad
      if (Math.abs(a.popularity - b.popularity) > 10) {
        return b.popularity - a.popularity;
      }
      
      // Prioridad 3: Margen de ganancia
      const marginA = (a.menu_price - a.cost) / a.menu_price;
      const marginB = (b.menu_price - b.cost) / b.menu_price;
      
      return marginB - marginA;
    });
  };

  // Aplicar todos los filtros
  const applyFilters = () => {
    let filtered = menus.filter(menu => {
      // Búsqueda por texto
      const matchesSearch = menu.menu_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          menu.menu_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          menu.menu_price?.toString().includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // Filtro por estado
      if (filters.status !== 'all') {
        const status = getMenuStatus(menu).status;
        if (status !== filters.status) return false;
      }
      
      // Filtro por categoría
      if (filters.category !== 'all' && menu.category !== filters.category) {
        return false;
      }
      
      // Solo disponibles
      if (filters.onlyAvailable && !isMenuAvailable(menu)) {
        return false;
      }
      
      // Ocultar agotados
      if (!filters.showOutOfStock && menu.stock_level === 0) {
        return false;
      }
      
      return true;
    });
    
    // Aplicar ordenamiento inteligente
    filtered = sortMenusByBusinessLogic(filtered);
    
    setFilteredMenus(filtered);
  };

  // Manejar eliminación con validaciones
  const handleDelete = async () => {
    try {
      const validations = await validateDeletion(deleteDialog.menu);
      const errors = validations.filter(v => v.type === 'error');
      
      if (errors.length > 0) {
        showSnackbar(errors[0].message, 'error');
        setDeleteDialog({ open: false, menu: null });
        return;
      }
      
      const warnings = validations.filter(v => v.type === 'warning');
      if (warnings.length > 0) {
        const confirmMessage = warnings.map(w => w.message).join('\n') + '\n\n¿Continuar?';
        if (!window.confirm(confirmMessage)) {
          setDeleteDialog({ open: false, menu: null });
          return;
        }
      }
      
      await menusAPI.delete(deleteDialog.menu.id);
      setDeleteDialog({ open: false, menu: null });
      showSnackbar('Menú eliminado exitosamente', 'success');
      fetchMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      showSnackbar('Error al eliminar el menú', 'error');
    }
  };

  const openDeleteDialog = (menu) => {
    if (!canPerformAction('delete', menu)) {
      showSnackbar('No tienes permisos para eliminar este menú', 'warning');
      return;
    }
    setDeleteDialog({ open: true, menu });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, menu: null });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Métricas de negocio
  const businessMetrics = useMemo(() => {
    if (!canPerformAction('view_metrics') || !menus.length) return null;
    
    const totalMenus = menus.length;
    const availableMenus = menus.filter(m => isMenuAvailable(m) && m.stock_level > 0).length;
    const lowStockMenus = menus.filter(m => m.stock_level <= businessRules.LOW_STOCK_THRESHOLD).length;
    const avgMargin = menus.reduce((acc, m) => {
      const margin = (m.menu_price - m.cost) / m.menu_price;
      return acc + margin;
    }, 0) / menus.length;
    
    return {
      totalMenus,
      availableMenus,
      lowStockMenus,
      avgMargin: (avgMargin * 100).toFixed(1)
    };
  }, [menus, userConfig.role, businessRules]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando menús...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Gestión de Menús
          {userConfig.role !== USER_ROLES.VIEWER && (
            <Chip 
              label={userConfig.role.toUpperCase()} 
              size="small" 
              color="primary" 
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        <Box display="flex" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={userConfig.autoRefresh}
                onChange={(e) => setUserConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
              />
            }
            label="Auto-refresh"
          />
          {canPerformAction('edit_rules') && (
            <Tooltip title="Configurar Reglas de Negocio">
              <IconButton onClick={openSettings}>
                <Security />
              </IconButton>
            </Tooltip>
          )}
          {canPerformAction('create') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/menus/new')}
            >
              Nuevo Menú
            </Button>
          )}
        </Box>
      </Box>

      {/* Métricas de negocio */}
      {businessMetrics && userConfig.showBusinessMetrics && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Restaurant color="primary" />
                  <Box ml={2}>
                    <Typography variant="h6">{businessMetrics.totalMenus}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Menús</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={businessMetrics.availableMenus} color="success">
                    <Inventory color="primary" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{businessMetrics.availableMenus}</Typography>
                    <Typography variant="body2" color="textSecondary">Disponibles</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={businessMetrics.lowStockMenus} color="warning">
                    <Warning color="primary" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{businessMetrics.lowStockMenus}</Typography>
                    <Typography variant="body2" color="textSecondary">Stock Bajo</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="primary" />
                  <Box ml={2}>
                    <Typography variant="h6">{businessMetrics.avgMargin}%</Typography>
                    <Typography variant="body2" color="textSecondary">Margen Promedio</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar menús por nombre, descripción o precio..."
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="available">Disponible</MenuItem>
                <MenuItem value="out_of_stock">Agotado</MenuItem>
                <MenuItem value="low_stock">Stock Bajo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="desayuno">Desayuno</MenuItem>
                <MenuItem value="almuerzo">Almuerzo</MenuItem>
                <MenuItem value="cena">Cena</MenuItem>
                <MenuItem value="bebida">Bebida</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.onlyAvailable}
                    onChange={(e) => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked }))}
                    size="small"
                  />
                }
                label="Solo disponibles"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showOutOfStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, showOutOfStock: e.target.checked }))}
                    size="small"
                  />
                }
                label="Mostrar agotados"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alertas de Happy Hour */}
      {(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const isHappyHour = currentHour >= businessRules.HAPPY_HOUR.start && 
                          currentHour <= businessRules.HAPPY_HOUR.end;
        
        if (isHappyHour) {
          return (
            <Alert severity="info" sx={{ mb: 2 }} icon={<LocalOffer />}>
              <AlertTitle>¡Happy Hour Activo!</AlertTitle>
              {(businessRules.HAPPY_HOUR.discount * 100)}% de descuento en todos los menús hasta las {businessRules.HAPPY_HOUR.end}:00
            </Alert>
          );
        }
        
        return null;
      })()}

      {/* Lista de menús */}
      {filteredMenus.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron menús
          </Typography>
          {canPerformAction('create') && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => navigate('/menus/new')}
              sx={{ mt: 2 }}
            >
              Crear primer menú
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMenus.map((menu) => {
            const menuStatus = getMenuStatus(menu);
            const dynamicPrice = calculateDynamicPrice(menu);
            const priceValidation = validateMenuPrice(menu);
            const isDiscounted = dynamicPrice !== menu.menu_price;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={menu.id}>
                <Card sx={{ position: 'relative', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" component="div">
                          {menu.menu_name}
                          {menu.seasonal && (
                            <Chip 
                              label="Estacional" 
                              size="small" 
                              color="info" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {menu.category} • Popularidad: {menu.popularity}%
                        </Typography>
                      </Box>
                      <Box>
                        {canPerformAction('edit', menu) && (
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/menus/edit/${menu.id}`)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {canPerformAction('delete', menu) && (
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(menu)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="flex-start" mb={2}>
                      <Restaurant sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {menu.menu_description}
                      </Typography>
                    </Box>
                    
                    {/* Precios */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        {isDiscounted ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ textDecoration: 'line-through' }}
                            >
                              {formatPrice(menu.menu_price)}
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
                              <Typography variant="h6" color="error.main">
                                {formatPrice(dynamicPrice)}
                              </Typography>
                              <LocalOffer sx={{ fontSize: 14, ml: 0.5, color: 'error.main' }} />
                            </Box>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center">
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="h6" color="primary">
                              {formatPrice(dynamicPrice)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Tooltip title={`${menuStatus.label} - Stock: ${menu.stock_level}`}>
                        <Chip
                          icon={menuStatus.icon}
                          label={menuStatus.label}
                          color={menuStatus.color}
                          size="small"
                        />
                      </Tooltip>
                    </Box>

                    {/* Información adicional para roles con permisos */}
                    {canPerformAction('view_metrics') && (
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Costo: {formatPrice(menu.cost)} • 
                          Margen: {((dynamicPrice - menu.cost) / dynamicPrice * 100).toFixed(1)}% • 
                          Órdenes activas: {menu.active_orders}
                        </Typography>
                        
                        {!priceValidation.isValid && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              {priceValidation.message}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el menú{' '}
            <strong>{deleteDialog.menu?.menu_name}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
          {deleteDialog.menu?.active_orders > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este menú tiene {deleteDialog.menu.active_orders} órdenes activas.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para configurar reglas de negocio */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Reglas de Negocio</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Happy Hour</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Hora de Inicio"
                type="number"
                value={tempRules.HAPPY_HOUR.start}
                onChange={handleRuleChange('HAPPY_HOUR.start')}
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Hora de Fin"
                type="number"
                value={tempRules.HAPPY_HOUR.end}
                onChange={handleRuleChange('HAPPY_HOUR.end')}
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Descuento (%)"
                type="number"
                value={tempRules.HAPPY_HOUR.discount * 100}
                onChange={(e) => handleRuleChange('HAPPY_HOUR.discount')({ target: { value: Number(e.target.value) / 100 } })}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Horarios de Menús</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Corte de Desayuno (hora)"
                type="number"
                value={tempRules.BREAKFAST_CUTOFF}
                onChange={handleRuleChange('BREAKFAST_CUTOFF')}
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Corte de Almuerzo (hora)"
                type="number"
                value={tempRules.LUNCH_CUTOFF}
                onChange={handleRuleChange('LUNCH_CUTOFF')}
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Inicio de Cena (hora)"
                type="number"
                value={tempRules.DINNER_START}
                onChange={handleRuleChange('DINNER_START')}
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Otras Reglas</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Margen Mínimo de Ganancia (%)"
                type="number"
                value={tempRules.MIN_PROFIT_MARGIN * 100}
                onChange={(e) => handleRuleChange('MIN_PROFIT_MARGIN')({ target: { value: Number(e.target.value) / 100 } })}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Umbral de Stock Bajo"
                type="number"
                value={tempRules.LOW_STOCK_THRESHOLD}
                onChange={handleRuleChange('LOW_STOCK_THRESHOLD')}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancelar</Button>
          <Button onClick={saveBusinessRules} color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MenuList;