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
  InputAdornment,
} from '@mui/material';
import { Save, ArrowBack, AttachMoney } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { menusAPI } from '../../services/api';

// Función para generar un ID aleatorio numérico
const generateUniqueId = () => {
  return Math.floor(Math.random() * 1000000000); // Genera un número aleatorio de 9 dígitos
};

function MenuForm() {
  const [menu, setMenu] = useState({
    id: '',
    menu_name: '',
    menu_description: '',
    menu_price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Función para obtener el último ID (verificamos el último valor existente)
  const fetchLastId = async () => {
    try {
      const response = await menusAPI.getLastId(); // Método de tu API que devuelve el último ID
      if (response.data && response.data.lastId) {
        return response.data.lastId;
      }
      return 0;  // Si no hay ID, empezar desde 0
    } catch (error) {
      console.error('Error al obtener el último ID:', error);
      return 0;  // Si falla, empezar desde 0
    }
  };

  // useEffect para cargar datos en edición o generar ID para creación
  useEffect(() => {
    const initializeMenu = async () => {
      if (isEdit) {
        await fetchMenu();
      } else {
        let uniqueId = generateUniqueId(); // Generar ID numérico aleatorio
        setMenu(prev => ({ ...prev, id: uniqueId }));
      }
    };

    initializeMenu();
  }, [id, isEdit]);

  // Obtener los datos del menú para edición
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.getById(id);
      setMenu(response.data);
    } catch (error) {
      setError('Error al cargar los datos del menú');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMenu(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!menu.menu_name.trim()) {
      setError('El nombre del menú es requerido');
      return false;
    }
    if (!menu.menu_description.trim()) {
      setError('La descripción del menú es requerida');
      return false;
    }
    if (!menu.menu_price || menu.menu_price <= 0) {
      setError('El precio debe ser mayor a 0');
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
        const menuData = {
          ...menu,
          menu_price: parseFloat(menu.menu_price),
          id: parseInt(id) // Usar el ID actual para edición
        };
        await menusAPI.update(menuData);
        setSuccess('Menú actualizado exitosamente');
      } else {
        // Para la creación, enviamos el ID numérico generado
        const menuData = {
          id: menu.id, // El ID generado aleatoriamente
          menu_name: menu.menu_name,
          menu_description: menu.menu_description,
          menu_price: parseFloat(menu.menu_price),
        };
        await menusAPI.create(menuData);
        setSuccess('Menú creado exitosamente');
      }
      
      setTimeout(() => {
        navigate('/menus');
      }, 1500);
    } catch (error) {
      console.error('Error saving menu:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          (isEdit ? 'Error al actualizar el menú' : 'Error al crear el menú');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && (isEdit || !menu.id)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {isEdit ? 'Cargando menú...' : 'Generando ID...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/menus')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Editar Menú' : 'Nuevo Menú'}
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
                  label="ID"
                  name="id"
                  value={menu.id}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={isEdit ? "ID del menú (solo lectura)" : "ID generado automáticamente"}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Menú"
                  name="menu_name"
                  value={menu.menu_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Ej: Menú Ejecutivo, Menú Premium, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción del Menú"
                  name="menu_description"
                  multiline
                  rows={4}
                  value={menu.menu_description}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Describe los platos incluidos, ingredientes principales, etc."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio"
                  name="menu_price"
                  type="number"
                  value={menu.menu_price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  inputProps={{ 
                    min: 0, 
                    step: 0.01 
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/menus')}
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

export default MenuForm;
