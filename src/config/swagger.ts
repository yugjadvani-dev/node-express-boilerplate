import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.appName,
      version: '1.0.0',
      description: 'Production-ready RESTful API — Node.js + Express + TypeScript + PostgreSQL',
      contact: { name: 'API Support', email: 'support@yourapp.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `http://localhost:${config.port}${config.apiPrefix}`, description: 'Development' },
      { url: `https://api.yourapp.com${config.apiPrefix}`, description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            totalResults: { type: 'integer' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
