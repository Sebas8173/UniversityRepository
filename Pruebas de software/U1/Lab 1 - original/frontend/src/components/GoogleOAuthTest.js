import React from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

const TestContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const TestPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
}));

export default function GoogleOAuthTest() {
  const handleTestGoogleAuth = () => {
    // Simular el flujo de un nuevo usuario de Google
    const params = new URLSearchParams();
    params.set('registerGoogleUser', 'true');
    params.set('email', 'test@gmail.com');
    params.set('username', 'testuser');
    params.set('message', encodeURIComponent('¿Desea registrarse en nuestra aplicación QuickQuote Catering?'));
    
    // Simular redirección
    window.history.pushState({}, '', `/?${params.toString()}`);
    window.location.reload();
  };

  const handleTestExistingUser = () => {
    // Simular token de usuario existente
    const token = 'test-jwt-token-12345';
    localStorage.setItem('token', token);
    window.location.href = '/';
  };

  const currentUrl = window.location.href;
  const hasRegisterParams = currentUrl.includes('registerGoogleUser=true');

  return (
    <TestContainer maxWidth="md">
      <TestPaper elevation={3}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Google OAuth Integration Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          Esta página permite probar el flujo de Google OAuth sin necesidad de configurar las credenciales reales.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>URL actual:</strong> {currentUrl}
          </Typography>
        </Alert>

        {hasRegisterParams && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            ¡Parámetros de registro de Google detectados! El diálogo de términos debería aparecer.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleTestGoogleAuth}
            fullWidth
          >
            Simular Nuevo Usuario de Google
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={handleTestExistingUser}
            fullWidth
          >
            Simular Usuario Existente
          </Button>
          
          <Button
            variant="text"
            onClick={() => window.location.href = '/auth'}
            fullWidth
          >
            Ir a Página de Auth
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Flujo Implementado:
          </Typography>
          <Typography variant="body2" component="div">
            <ol>
              <li>Usuario hace clic en "Ingresar con Google"</li>
              <li>Redirección a Google OAuth</li>
              <li>Google redirige a /auth/google/callback</li>
              <li>Si es nuevo usuario: redirige con parámetros de registro</li>
              <li>TokenHandler detecta parámetros y muestra GoogleRegisterDialog</li>
              <li>Usuario acepta términos y se registra</li>
              <li>Se guarda token y redirige al dashboard</li>
            </ol>
          </Typography>
        </Box>
      </TestPaper>
    </TestContainer>
  );
}
