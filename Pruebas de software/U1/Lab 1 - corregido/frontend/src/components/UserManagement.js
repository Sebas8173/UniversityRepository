// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Edit,
  Refresh,
  PersonAdd
} from '@mui/icons-material';
import { authAPI } from '../services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  // Cargar todos los usuarios
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      showAlert('Error al cargar usuarios: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuarios
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.searchUsers(searchQuery);
      setUsers(response.data || []);
    } catch (error) {
      showAlert('Error al buscar usuarios: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar rol de usuario
  const updateUserRole = async () => {
    if (!selectedUser || !newRole) {
      showAlert('Por favor seleccione un usuario y un rol válido', 'error');
      return;
    }

    if (newRole === selectedUser.role) {
      showAlert('El usuario ya tiene ese rol asignado', 'warning');
      setEditDialogOpen(false);
      return;
    }

    // Validar que no se esté auto-degradando
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = selectedUser._id || selectedUser.id;
    if (userId === currentUser.id && newRole !== 'superadmin') {
      showAlert('No puedes cambiar tu propio rol de SuperAdmin', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating user role:', { userId, newRole, selectedUser });
      const response = await authAPI.updateUserRole(userId, newRole);
      
      if (response.data) {
        showAlert(`Rol actualizado exitosamente para ${selectedUser.username}`, 'success');
        setEditDialogOpen(false);
        setSelectedUser(null);
        setNewRole('');
        fetchUsers(); // Recargar la lista
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showAlert('Error al actualizar rol: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar alerta
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  // Abrir diálogo de edición
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };

  // Obtener color del chip según el rol
  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'admin': return 'warning';
      case 'client': return 'primary';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Administra los usuarios y sus roles en el sistema
      </Typography>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Buscar por nombre, email o rol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={searchUsers}>
                    <Search />
                  </IconButton>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchUsers}
            >
              Actualizar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuarios ({users.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Términos Aceptados</TableCell>
                    <TableCell>Fecha de Registro</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id || user._id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.termsAccepted ? 'Sí' : 'No'} 
                          color={user.termsAccepted ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Usuario: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Email: {selectedUser?.email}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Rol actual: {selectedUser?.role}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Nuevo Rol</InputLabel>
              <Select
                value={newRole}
                label="Nuevo Rol"
                onChange={(e) => setNewRole(e.target.value)}
              >
                <MenuItem value="client">Cliente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="superadmin">Super Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={updateUserRole}
            variant="contained"
            disabled={!newRole || newRole === selectedUser?.role}
          >
            Actualizar Rol
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
