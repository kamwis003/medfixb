import dotenv from 'dotenv'
dotenv.config()

import express, { Express } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import routes from './routes'
import { errorHandler } from './middlewares/error-handler'
import { swaggerSpec } from './config/swagger'
import { env } from './config/env'
import helmet from 'helmet'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('Server')

const app: Express = express()

const getClientOrigin = () => `http://localhost:${env.PORT + 1}`
// Middlewares
app.use(cors({
  origin: getClientOrigin(),
  credentials: true
}))

app.disable('x-powered-by')

app.use(express.json())

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(routes)

// Central error handler must be last
app.use(errorHandler)

app.use(helmet())

app.listen(env.PORT, () => {
  logger.info(`Server is running at http://localhost:${env.PORT}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
  logger.info(`API documentation available at http://localhost:${env.PORT}/api-docs`)
})
