import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import { Button, TextField, Box, Typography, Divider, Grid } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function RegisterForm() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(
        'https://espe-2025-team1-codesynergy.onrender.com/quickquote/webresources/Auth/register',
        form
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/auth');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = 'https://espe-2025-team1-codesynergy.onrender.com/auth/google';
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Usuario"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Registrarse
        </Button>
        <Divider sx={{ my: 2 }}>o</Divider>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleRegister}
          sx={{ textTransform: 'none' }}
        >
          Registrarse con Google
        </Button>
      </Box>
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>
          ¡Registro exitoso! Ahora puedes iniciar sesión.
        </Alert>
      </Snackbar>
    </>
  );
}
