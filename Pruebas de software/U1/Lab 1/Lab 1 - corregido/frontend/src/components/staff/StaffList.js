// src/components/staff/StaffList.js
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
  Person,
  Work,
  Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../../services/api';

function StaffList() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, staff: null });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const filtered = staff.filter(member =>
      member.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.staff_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.staff_contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStaff(filtered);
  }, [staff, searchTerm]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll();
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await staffAPI.delete(deleteDialog.staff.id);
      setDeleteDialog({ open: false, staff: null });
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const openDeleteDialog = (staff) => {
    setDeleteDialog({ open: true, staff });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, staff: null });
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'chef': 'primary',
      'camarero': 'secondary',
      'mesero': 'secondary',
      'coordinador': 'success',
      'gerente': 'warning',
      'supervisor': 'info',
    };
    
    const normalizedRole = role?.toLowerCase() || '';
    return roleColors[normalizedRole] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando personal...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Personal</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/staff/new')}
        >
          Nuevo Personal
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar personal por nombre, rol o contacto..."
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

      {filteredStaff.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontró personal
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/staff/new')}
            sx={{ mt: 2 }}
          >
            Agregar primer empleado
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredStaff.map((member) => (
            <Grid item xs={12} md={6} lg={4} key={member.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {member.staff_name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/staff/edit/${member.id}`)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(member)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Chip 
                      label={member.staff_role} 
                      size="small" 
                      variant="outlined"
                      color={getRoleColor(member.staff_role)}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {member.staff_contact}
                    </Typography>
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
            ¿Está seguro que desea eliminar al empleado{' '}
            <strong>{deleteDialog.staff?.staff_name}</strong>
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

export default StaffList;