// src/components/common/RoleBasedActions.js
import React from 'react';
import { IconButton, Box, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { hasRole } from '../../utils/auth';

function RoleBasedActions({ 
  item, 
  onView, 
  onEdit, 
  onDelete, 
  viewRoles = ['client', 'admin', 'superadmin'],
  editRoles = ['admin', 'superadmin'],
  deleteRoles = ['admin', 'superadmin'],
  itemType = 'elemento'
}) {
  const canView = hasRole(viewRoles) && onView;
  const canEdit = hasRole(editRoles) && onEdit;
  const canDelete = hasRole(deleteRoles) && onDelete;

  return (
    <Box>
      {canView && (
        <Tooltip title={`Ver ${itemType}`}>
          <IconButton
            size="small"
            onClick={() => onView(item)}
            color="info"
          >
            <Visibility />
          </IconButton>
        </Tooltip>
      )}
      
      {canEdit && (
        <Tooltip title={`Editar ${itemType}`}>
          <IconButton
            size="small"
            onClick={() => onEdit(item)}
            color="primary"
          >
            <Edit />
          </IconButton>
        </Tooltip>
      )}
      
      {canDelete && (
        <Tooltip title={`Eliminar ${itemType}`}>
          <IconButton
            size="small"
            onClick={() => onDelete(item)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default RoleBasedActions;
