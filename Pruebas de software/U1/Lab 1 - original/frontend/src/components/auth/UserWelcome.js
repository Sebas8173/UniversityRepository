import React from 'react';
import { Typography, Box } from '@mui/material';

export default function UserWelcome({ user }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" color="primary">
        ¡Bienvenido, {user?.username || user?.email || 'Usuario'}!
      </Typography>
    </Box>
  );
}
