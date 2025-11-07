// src/components/clients/ClientList.js
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
  Typography,
  TextField,
  InputAdornment,
  Alert,
  Fab,
  Chip,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Email,
  Phone,
  LocationOn,
  PictureAsPdf,
  Download,
  MoreVert,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { drawTableHeader, drawTableRow, checkPageBreak, addFooter } from '../../utils/pdfClients';
import { clientsAPI } from '../../services/api';
import { hasRole } from '../../utils/auth';
import RoleBasedActions from '../common/RoleBasedActions';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [exportMenu, setExportMenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (clientsToExport = null, title = 'Reporte de Clientes') => {
    try {
      setGeneratingPdf(true);
      const dataToExport = clientsToExport || clients;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const currentDate = new Date().toLocaleDateString('es-ES');
      
      let yPosition = 25;

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(title, margin, yPosition);
      yPosition += 15;
      
      // Subtitle and date
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generado el: ${currentDate}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total de clientes: ${dataToExport.length}`, margin, yPosition);
      yPosition += 15;
      
      // Company info
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Reporte de Auditoría - Sistema de Gestión de Clientes', margin, yPosition);
      yPosition += 20;

      // Table setup
      const rowHeight = 35;
      const colWidths = [15, 25, 50, 60, 35, 50]; // Column widths
      const colPositions = [margin]; // Starting positions for each column
      
      // Calculate column positions
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i-1] + colWidths[i-1]);
      }

      // Draw header
      yPosition = drawTableHeader(doc, colPositions, pageWidth, margin, yPosition);

      // Draw all clients
      dataToExport.forEach((client, index) => {
        yPosition = checkPageBreak(doc, yPosition, rowHeight, pageHeight);
        yPosition = drawTableRow(doc, client, index, colPositions, colWidths, rowHeight, yPosition, index % 2 === 1);
      });

      // Add summary if there's space
      yPosition += 20;
      yPosition = checkPageBreak(yPosition, 80);
      
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen:', margin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      
      const clientsWithEmail = dataToExport.filter(c => c.email && c.email !== '').length;
      const clientsWithPhone = dataToExport.filter(c => c.phone && c.phone !== '').length;
      const clientsWithAddress = dataToExport.filter(c => c.address && c.address !== '').length;
      
      const summaryLines = [
        `• Total de clientes registrados: ${dataToExport.length}`,
        `• Clientes con email: ${clientsWithEmail} (${((clientsWithEmail/dataToExport.length)*100).toFixed(1)}%)`,
        `• Clientes con teléfono: ${clientsWithPhone} (${((clientsWithPhone/dataToExport.length)*100).toFixed(1)}%)`,
        `• Clientes con dirección: ${clientsWithAddress} (${((clientsWithAddress/dataToExport.length)*100).toFixed(1)}%)`
      ];
      
      summaryLines.forEach((line, index) => {
        yPosition = checkPageBreak(yPosition, 10);
        doc.text(line, margin + 5, yPosition);
        yPosition += 10;
      });

      // Add footer to all pages
      addFooter(doc, margin, pageWidth, pageHeight);

      // Save PDF
      const filename = `clientes_auditoria_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      setExportMenu(null);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor intente de nuevo.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateFilteredPDF = () => {
    generatePDF(filteredClients, `Reporte de Clientes - Filtrados (${searchTerm})`);
  };

  const generateFullPDF = () => {
    generatePDF(clients, 'Reporte Completo de Clientes');
  };

  const handleDelete = async () => {
    try {
      await clientsAPI.delete(deleteDialog.client.id_client);
      setDeleteDialog({ open: false, client: null });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleEdit = (client) => {
    navigate(`/clients/edit/${client.id_client}`);
  };

  const openDeleteDialog = (client) => {
    setDeleteDialog({ open: true, client });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, client: null });
  };

  const handleExportMenuClick = (event) => {
    setExportMenu(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenu(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando clientes...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Clientes</Typography>
        <Box display="flex" gap={2}>
          {/* Export Button */}
          {hasRole(['admin', 'superadmin']) && clients.length > 0 && (
            <Button
              variant="outlined"
              startIcon={generatingPdf ? <CircularProgress size={16} /> : <PictureAsPdf />}
              onClick={handleExportMenuClick}
              disabled={generatingPdf}
            >
              {generatingPdf ? 'Generando...' : 'Exportar PDF'}
            </Button>
          )}
          
          {hasRole(['admin', 'superadmin']) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/clients/new')}
            >
              Nuevo Cliente
            </Button>
          )}
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenu}
        open={Boolean(exportMenu)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={generateFullPDF} disabled={generatingPdf}>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Todos los clientes" 
            secondary={`${clients.length} registros`}
          />
        </MenuItem>
        {searchTerm && (
          <MenuItem onClick={generateFilteredPDF} disabled={generatingPdf}>
            <ListItemIcon>
              <Search fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Solo resultados filtrados" 
              secondary={`${filteredClients.length} registros`}
            />
          </MenuItem>
        )}
      </Menu>

      {filteredClients.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No se encontraron clientes.
          {hasRole(['admin', 'superadmin']) && ' Haz clic en "Nuevo Cliente" para agregar el primero.'}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar clientes por nombre, email o teléfono..."
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
      </Box>

      {filteredClients.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron clientes
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/clients/new')}
            sx={{ mt: 2 }}
          >
            Crear primer cliente
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredClients.map((client) => (
            <Grid item xs={12} md={6} lg={4} key={client.id_client}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {client.first_name} {client.last_name}
                    </Typography>
                    <RoleBasedActions
                      item={client}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                      editRoles={['admin', 'superadmin']}
                      deleteRoles={['admin', 'superadmin']}
                      itemType="cliente"
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {client.email || 'No especificado'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {client.phone || 'No especificado'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="flex-start">
                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {client.address || 'No especificado'}
                    </Typography>
                  </Box>
                  
                  <Box mt={2}>
                    <Chip 
                      label={`ID: ${client.id_client}`} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for mobile */}
      {hasRole(['admin', 'superadmin']) && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => navigate('/clients/new')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' }
          }}
        >
          <Add />
        </Fab>
      )}

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar al cliente{' '}
            <strong>
              {deleteDialog.client?.first_name} {deleteDialog.client?.last_name}
            </strong>
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

export default ClientList;