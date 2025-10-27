import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { authAPI } from '../../services/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1),
    maxWidth: '500px',
  },
}));

const TermsText = styled(Typography)(({ theme }) => ({
  maxHeight: '200px',
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.grey[300]}`,
}));

export default function GoogleRegisterDialog({ open, onClose, email, username, message }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!termsAccepted) {
      setError('Debe aceptar los términos y condiciones para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.registerGoogleUser({
        email,
        username,
        termsAccepted: true
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    // Redirigir a la página de auth
    window.location.href = '/auth';
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="h2" align="center" color="primary">
          Bienvenido a QuickQuote Catering
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            {message || 'Para completar su registro con Google, necesita aceptar nuestros términos y condiciones.'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Email:</strong> {email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Usuario:</strong> {username}
          </Typography>
        </Box>

        <TermsText variant="body2">
          <strong>TÉRMINOS Y CONDICIONES DE USO - QUICKQUOTE CATERING</strong>
          <br /><br />
          
          <strong>1. ACEPTACIÓN DE TÉRMINOS</strong>
          <br />
          Al utilizar QuickQuote Catering, usted acepta estar sujeto a estos términos y condiciones de uso.
          <br /><br />
          
          <strong>2. DESCRIPCIÓN DEL SERVICIO</strong>
          <br />
          QuickQuote Catering es una plataforma digital que facilita la cotización y reserva de servicios de catering para eventos.
          <br /><br />
          
          <strong>3. REGISTRO Y CUENTA DE USUARIO</strong>
          <br />
          - Debe proporcionar información precisa y actualizada durante el registro
          <br />
          - Es responsable de mantener la confidencialidad de sus credenciales
          <br />
          - Debe notificar inmediatamente cualquier uso no autorizado de su cuenta
          <br /><br />
          
          <strong>4. USO ACEPTABLE</strong>
          <br />
          Se compromete a usar la plataforma únicamente para fines legítimos relacionados con servicios de catering.
          <br /><br />
          
          <strong>5. PRIVACIDAD</strong>
          <br />
          Sus datos personales serán tratados conforme a nuestra Política de Privacidad.
          <br /><br />
          
          <strong>6. LIMITACIÓN DE RESPONSABILIDAD</strong>
          <br />
          QuickQuote Catering actúa como intermediario entre clientes y proveedores de catering.
          <br /><br />
          
          <strong>7. MODIFICACIONES</strong>
          <br />
          Nos reservamos el derecho de modificar estos términos en cualquier momento.
        </TermsText>

        <FormControlLabel
          control={
            <Checkbox
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (e.target.checked && error) {
                  setError('');
                }
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              He leído y acepto los términos y condiciones de uso de QuickQuote Catering
            </Typography>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleCancel} 
          variant="outlined"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleRegister}
          variant="contained"
          disabled={!termsAccepted || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Registrando...' : 'Aceptar y Registrarse'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}
