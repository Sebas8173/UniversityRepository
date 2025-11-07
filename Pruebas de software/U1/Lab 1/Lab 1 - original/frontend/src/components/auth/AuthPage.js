import React, { useEffect } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';


export default function AuthPage() {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          QuickQuote - Acceso
        </Typography>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="Ingresar" />
          <Tab label="Registrarse" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {tab === 0 && <LoginForm />}
          {tab === 1 && <RegisterForm />}
        </Box>
      </Paper>
    </Container>
  );
}