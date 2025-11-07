const request = require('supertest'); // importamos la libreria supertest
const app = require('../src/app'); // importamos el modulo principal de la app

// agrupamos el conjunto de pruebas
describe('User API', ()=>{

    //Prueba GET que devuelve una lista vacia inicialmente
    test('GET /api/users should return an empty list initially', async()=>{
        //guardamos la constante
        const res = await request(app).get('/api/users');

        expect(res.statusCode).toBe(200);//esperamos que se realizo la peticion
        expect(res.body).toEqual([]); //espera que haya una lista vacia
    });

    //Prueba POST crea un usario correctamente
    test('POST /api/users should return create a new user', async() =>{
        const newUser = {
            name:'Moises',
            email: 'moises@gmail.com'
        };

        const res = await request(app)
        .post('/api/users')
        .send(newUser);

        expect(res.statusCode).toBe(201);//esperamos un 201 de ejecucion valida
        expect(res.body).toHaveProperty('id');//esperamos que el cuerpo tenga una propiedad 'id'
        expect(res.body.name).toBe('Moises');//esperamo que el nombre sea Moises
        expect(res.body.email).toBe('moises@gmail.com'); //esperamos que el email sea moises@gmail.com
    });

    //Prueba el endpoint que rechace las peticiones incompletas
    test('POST /api/users should fail if data is incomplete', async()=>{

        const res = await request(app)
        .post('/api/users')
        .send({name:'Moises'});
    
        expect(res.statusCode).toBe(400) //esperamos un 400 de error
        expect(res.body).toHaveProperty('message','Name and email are required');//esperamos el mensaje del error
    });

    //Prueba GET que retorne una lista en memoria
    test('GET /api/ should return a list in memory', async()=>{
        const res = await request(app)
        .get('/api/users');

        expect(res.statusCode).toBe(200); //espera que funcione la llamada al GET
        expect(res.body).not.toEqual([]); //espera que la lista no este vacia
    });
    
    //Prueba POST y verifica con un GET el contenido
    test('POST then GET /api/users return create new user and test the list of registers', async()=>{

        const newUser = {name:'Sebastian', email:'sebastian@gmail.com'}; //creamos un arreglo de usuario

        //ejecutamos el metodo POST
        const res = await request(app)
        .post('/api/users')
        .send(newUser);

        expect(res.statusCode).toBe(201);

        const createdUser = res.body; //pasamos el objeto del usuario luego de que se creo
        expect(createdUser).toHaveProperty('id'); //esperamos que se haya creado correctamente con id
        expect(createdUser.name).toBe('Sebastian'); // esperamos que contenga el nombre 'Sebastian'
        expect(createdUser.email).toBe('sebastian@gmail.com'); //esperamos que contenga el email 'sebastian@gmail.com'

        //Ejecutamos el metodo GET
        const getAllUsers = await request(app)
        .get('/api/users');

        expect(getAllUsers.statusCode).toBe(200); //esperamos una respuesta correcta
        expect(getAllUsers.body).not.toEqual([]); //esperamos que la consulta no este vacia
        expect(getAllUsers.body).toContainEqual(createdUser); //esperamos que exista el objeto nuevo en el ultimo espacio del arreglo
    });

    //Prueba que el endpoint rechace numeros en el nombre
    test('POST /api/users should fail if give numbers in the name', async()=>{
        const res = await request(app).post('/api/users')
        .send({name:'Moises123',email:'moises123@gmail.com'});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message','Name must not contain numbers');
    });

    //Prueba el endpoint que rechace si el nombre contiene espacios
    test('POST /api/users should fail if give space in the name', async()=>{
        const res = await request(app).post('/api/users').send({name:' ', email:' '});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message','Name and email must not contain space');
    });

    //Prueba para ruta no encontrada (404) 
    test('Get route not found 404', async()=>{
        const res = await request(app)
        .get('/some/nonexistent/route');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message','Route not found');
    });

});