const options = { openapi: '3.0.0' };
const swaggerAutogen = require('swagger-autogen')(options);

const doc = {
    info: {
        version: '2.0.0',
        title: 'FTS Base Project APIs',
        description: 'FTS Base Project APIs',
        contact: {
            name: 'FeelTech Solutions',
            email: 'connect@feeltechsolutions.com',
        },
    },
    host: 'localhost:5000',
    basePath: '/',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [],
    securityDefinitions: {
        jwtAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'JWT token sent by login API.',
        },
    },
    components: {
        schemas: {
            login: {
                email: 'example@example.com',
                password: 'password',
                rememberMe: true,
            },
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
            },
        },
    },
};

const outputFile = './docs/swagger.json';
const endpointsFiles = ['../server.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
