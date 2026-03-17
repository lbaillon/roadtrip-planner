import routes from '#api/routes/index.js'
import cookieParser from 'cookie-parser'
import express from 'express'
import { env } from './env.js'
import { errorHandler } from './middlewares/error-handler.js'

const app = express()
const PORT = env.PORT
app.set('trust proxy', 1) // for secure cookies to work correctly behind render.com proxy
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api', routes)

app.use(errorHandler) // must be last!

app.listen(PORT, () => {
  console.info(`🚀 API server running on http://localhost:${PORT}`)
})
