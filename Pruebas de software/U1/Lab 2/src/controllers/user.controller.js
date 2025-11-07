// Simulación de una base de datos en memoria
let users = [];

/**
 * Devuelve todos los usuarios almacenados
 */
function getAllUsers(req, res) {
  res.json(users)
}

/**
 * Crea un nuevo usuario si se proveen name y email válidos
 */
function createUser(req, res) {
  const { name, email } = req.body;

  // Validación básica de entrada
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' })
  }
  
  // Expresión Regular (/\d/) para verificar si el 'name' contiene
  // al menos un dígito (0-9). El método .test() devuelve true si encuentra un match.
  if (/\d/.test(name)) {
    return res.status(400).json({ message: 'Name must not contain numbers' });
  }

  if (name == ' ' || email == ' ') {
    return res.status(400).json({ message: 'Name and email must not contain space' });
  }

  // Creamos un objeto usuario
  const newUser = {
    id: Date.now(), // ID simulado
    name,
    email
  };

  // Lo añadimos al arreglo de usuarios
  users.push(newUser);

  // Respondemos con el usuario creado
  res.status(201).json(newUser);
}

module.exports = { getAllUsers, createUser };