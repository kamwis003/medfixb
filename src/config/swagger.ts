import swaggerJSDoc from 'swagger-jsdoc'
import { SwaggerDefinition } from 'swagger-jsdoc'

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'V-Campus Express API',
    version: '1.0.0',
    description: 'API documentation for V-Campus Express application',
    contact: {
      name: 'API Support',
      email: 'support@v-campus.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      TranslationMap: {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
        example: {
          pl: 'Przykładowy tekst',
          en: 'Example text',
          uk: 'Приклад тексту',
        },
      },
      PaginationMetadata: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
        },
        required: ['page', 'limit', 'total', 'totalPages'],
      },
      Product: {
        type: 'object',
        properties: {
          slug: { type: 'string', example: 'premium-plan' },
          nameTranslations: { $ref: '#/components/schemas/TranslationMap' },
          descriptionTranslations: { $ref: '#/components/schemas/TranslationMap' },
          price: { type: 'number', example: 99.99 },
          stripeProductId: { type: 'string', example: 'stripe_prod_123' },
          stripePriceId: { type: 'string', example: 'stripe_price_123' },
          isPurchased: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'slug',
          'nameTranslations',
          'descriptionTranslations',
          'price',
          'stripeProductId',
          'stripePriceId',
          'isPurchased',
          'createdAt',
          'updatedAt',
        ],
      },
      ProductListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: { $ref: '#/components/schemas/Product' },
              },
              pagination: { $ref: '#/components/schemas/PaginationMetadata' },
            },
            required: ['products', 'pagination'],
          },
        },
        required: ['success', 'data'],
      },
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          data: {
            type: 'object',
            nullable: true,
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success',
          },
          data: {
            type: 'object',
          },
        },
      },
      DiaryEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          painLevel: { type: 'integer', minimum: 0, maximum: 10 },
          painLocation: { type: 'string' },
          symptoms: { type: 'string' },
          hadSurgeryLast6Months: { type: 'boolean' },
          surgeryDescription: { type: 'string' },
          hormonalTreatment: { type: 'boolean' },
          recentImaging: { type: 'boolean' },
          cycleDay: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'date', 'painLevel', 'painLocation', 'symptoms',
          'hadSurgeryLast6Months', 'hormonalTreatment',
          'recentImaging'
        ],
      },
      Article: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        },
      },
      ArticleInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['title', 'content'],
      }
    },
  },
}

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.ts'],
}

export const swaggerSpec = swaggerJSDoc(options)
