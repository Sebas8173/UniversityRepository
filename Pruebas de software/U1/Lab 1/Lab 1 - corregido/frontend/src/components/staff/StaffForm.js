// src/components/staff/StaffForm.js
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
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { staffAPI } from '../../services/api';

function StaffForm() {
  const [staff, setStaff] = useState({
    staff_name: '',
    staff_role: '',
    staff_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const roles = [
    'Chef',
    'Camarero',
    'Mesero',
    'Coordinador',
    'Gerente',
    'Supervisor',
    'Cocinero',
    'Bartender',
    'Recepcionista',
    'Limpieza',
    'Seguridad',
  ];

  useEffect(() => {
    if (isEdit) {
      fetchStaff();
    }
  }, [id, isEdit]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getById(id);
      setStaff(response.data);
    } catch (error) {
      setError('Error al cargar los datos del personal');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStaff(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!staff.staff_name.trim()) {
      setError('El nombre del empleado es requerido');
      return false;
    }
    if (!staff.staff_role.trim()) {
      setError('El rol del empleado es requerido');
      return false;
    }
    if (!staff.staff_contact.trim()) {
      setError('El contacto del empleado es requerido');
      return false;
    }

    // Validar formato de contacto más flexible (teléfono o email)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
    
    if (!phoneRegex.test(staff.staff_contact) && !emailRegex.test(staff.staff_contact)) {
      setError('El contacto debe ser un teléfono válido (7-20 dígitos) o un email válido');
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
      
      if (isEdit) {
        const staffData = { ...staff, id: Number.parseInt(id) };
        await staffAPI.update(staffData);
        setSuccess('Personal actualizado exitosamente');
      } else {
        // Para creación, NO enviar ID local
        const staffData = {
          staff_name: staff.staff_name,
          staff_role: staff.staff_role,
          staff_contact: staff.staff_contact
        };
        
        console.log('Creating staff with data:', staffData);
        await staffAPI.create(staffData);
        setSuccess('Personal creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/staff');
      }, 1500);
    } catch (error) {
      setError(isEdit ? 'Error al actualizar el personal' : 'Error al crear el personal');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
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
          onClick={() => navigate('/staff')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Personal' : 'Nuevo Personal'}
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
                <TextField
                  fullWidth
                  label="Nombre del Empleado"
                  name="staff_name"
                  value={staff.staff_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Rol"
                  name="staff_role"
                  value={staff.staff_role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contacto"
                  name="staff_contact"
                  value={staff.staff_contact}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Teléfono o email"
                  helperText="Ingrese teléfono o email de contacto"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/staff')}
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

export default StaffForm;