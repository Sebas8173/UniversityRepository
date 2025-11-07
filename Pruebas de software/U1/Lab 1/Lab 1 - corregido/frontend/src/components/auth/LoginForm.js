import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography, Divider, Snackbar, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginForm() {
  const [form, setForm] = useState({ username: '', password: '' });
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
      const res = await axios.post(
        'https://espe-2025-team1-codesynergy.onrender.com/quickquote/webresources/Auth/login',
        form
      );
      localStorage.setItem('token', res.data.token);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al ingresar');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'https://espe-2025-team1-codesynergy.onrender.com/auth/google';
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Usuario"
          name="username"
          value={form.username}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Ingresar
        </Button>
        <Divider sx={{ my: 2 }}>o</Divider>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{ textTransform: 'none' }}
        >
          Ingresar con Google
        </Button>
      </Box>
      <Snackbar open={success} autoHideDuration={1000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>
          ¡Ingreso exitoso!
        </Alert>
      </Snackbar>
    </>
  );
}
