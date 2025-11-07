const express = require('express');
const { getAllUsers, createUser } = require('../controllers/user.controller');

const router = express.Router();

// Ruta GET para obtener todos los usuarios
router.get('/', getAllUsers);

// Ruta POST para crear un nuevo usuario
router.post('/', createUser);

module.exports = router;
