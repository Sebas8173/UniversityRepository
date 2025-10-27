
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard';
import AuthPage from './components/auth/AuthPage';
import TokenHandler from './components/auth/TokenHandler';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './components/UserManagement';
import GoogleOAuthTest from './components/GoogleOAuthTest';
import ClientList from './components/clients/ClientList';
import ClientForm from './components/clients/ClientForm';
import ReservationList from './components/reservations/ReservationList';
import ReservationForm from './components/reservations/ReservationForm';
import MenuList from './components/menus/MenuList';
import MenuForm from './components/menus/MenuForm';
import PaymentList from './components/payments/PaymentList';
import PaymentForm from './components/payments/PaymentForm';
import CateringList from './components/catering/CateringList';
import CateringForm from './components/catering/CateringForm';
import EventList from './components/events/EventList';
import EventForm from './components/events/EventForm';
import StaffList from './components/staff/StaffList';
import StaffForm from './components/staff/StaffForm';
import VenueList from './components/venues/VenueList';
import VenueForm from './components/venues/VenueForm';
import ReviewList from './components/reviews/ReviewList';
import ReviewForm from './components/reviews/ReviewForm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <AuthPage />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <TokenHandler />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/oauth-test" element={<GoogleOAuthTest />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    
                    {/* User Management - Solo SuperAdmin */}
                    <Route path="/user-management" element={
                      <ProtectedRoute requiredRole="superadmin">
                        <UserManagement />
                      </ProtectedRoute>
                    } />
                    
                    {/* Clients Routes - Solo Admin y SuperAdmin */}
                    <Route path="/clients" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ClientList />
                      </ProtectedRoute>
                    } />
                    <Route path="/clients/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ClientForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/clients/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ClientForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Reservations Routes - Solo Admin y SuperAdmin */}
                    <Route path="/reservations" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ReservationList />
                      </ProtectedRoute>
                    } />
                    <Route path="/reservations/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ReservationForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/reservations/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ReservationForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Menus Routes - Solo Admin y SuperAdmin */}
                    <Route path="/menus" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <MenuList />
                      </ProtectedRoute>
                    } />
                    <Route path="/menus/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <MenuForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/menus/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <MenuForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Payments Routes - Solo Admin y SuperAdmin */}
                    <Route path="/payments" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <PaymentList />
                      </ProtectedRoute>
                    } />
                    <Route path="/payments/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <PaymentForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/payments/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <PaymentForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Catering Routes - Solo Admin y SuperAdmin */}
                    <Route path="/catering" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <CateringList />
                      </ProtectedRoute>
                    } />
                    <Route path="/catering/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <CateringForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/catering/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <CateringForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Events Routes - Solo Admin y SuperAdmin */}
                    <Route path="/events" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <EventList />
                      </ProtectedRoute>
                    } />
                    <Route path="/events/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <EventForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/events/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <EventForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Staff Routes - Solo Admin y SuperAdmin */}
                    <Route path="/staff" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <StaffList />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <StaffForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/staff/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <StaffForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Venues Routes - Solo Admin y SuperAdmin */}
                    <Route path="/venues" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <VenueList />
                      </ProtectedRoute>
                    } />
                    <Route path="/venues/new" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <VenueForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/venues/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <VenueForm />
                      </ProtectedRoute>
                    } />
                    
                    {/* Reviews Routes - Todos pueden crear, solo admin puede editar todas */}
                    <Route path="/reviews" element={<ReviewList />} />
                    <Route path="/reviews/new" element={<ReviewForm />} />
                    <Route path="/reviews/edit/:id" element={
                      <ProtectedRoute requiredRole={['admin', 'superadmin']}>
                        <ReviewForm />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;