// src/components/common/Layout.js
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  EventNote,
  RestaurantMenu,
  Payment,
  RoomService,
  Event,
  Group,
  LocationOn,
  RateReview,
  LogoutOutlined,
  ManageAccounts,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserInfo, logout } from '../../utils/auth';

const drawerWidth = 240;

// Configuración de elementos del menú con permisos
const menuItemsConfig = [
  { 
    text: 'Dashboard', 
    icon: <Dashboard />, 
    path: '/', 
    roles: ['client', 'admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Usuarios', 
    icon: <ManageAccounts />, 
    path: '/user-management', 
    roles: ['superadmin'] 
  },
  { 
    text: 'Gestión de Clientes', 
    icon: <People />, 
    path: '/clients', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Reservaciones', 
    icon: <EventNote />, 
    path: '/reservations', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Menús', 
    icon: <RestaurantMenu />, 
    path: '/menus', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Pagos', 
    icon: <Payment />, 
    path: '/payments', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Servicios de Catering', 
    icon: <RoomService />, 
    path: '/catering', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Eventos', 
    icon: <Event />, 
    path: '/events', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Personal', 
    icon: <Group />, 
    path: '/staff', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Venues', 
    icon: <LocationOn />, 
    path: '/venues', 
    roles: ['admin', 'superadmin'] 
  },
  { 
    text: 'Gestión de Reseñas', 
    icon: <RateReview />, 
    path: '/reviews', 
    roles: ['client', 'admin', 'superadmin'] 
  },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    setUserInfo(user);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Filtrar elementos del menú según el rol del usuario
  const filteredMenuItems = menuItemsConfig.filter(item => 
    userInfo?.role && item.roles.includes(userInfo.role)
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'admin': return 'warning';
      case 'client': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          QuickQuote
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Información del Usuario */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Bienvenido
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {userInfo?.username || 'Usuario'}
        </Typography>
        {userInfo?.role && (
          <Chip 
            label={getRoleLabel(userInfo.role)} 
            color={getRoleColor(userInfo.role)} 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>
      <Divider />

      {/* Elementos del Menú Filtrados */}
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* Botón de Cerrar Sesión */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ 
              color: '#fff', 
              bgcolor: '#e57373', 
              m: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: '#ef9a9a' } 
            }}
          >
            <ListItemIcon sx={{ color: '#fff' }}>
              <LogoutOutlined />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            QuickQuote - Sistema de Gestión de Catering
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;