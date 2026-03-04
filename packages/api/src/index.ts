import routes from '#api/routes/index.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './env.js'

const app = express()
const PORT = env.PORT

app.use(
  cors({
    origin: [
      env.isDev
        ? 'http://localhost:5173'
        : 'https://roadtrip-planner-web.vercel.app',
    ],
    credentials: true,
  })
)
app.set('trust proxy', 1) // for secure cookies to work correctly behind render.com proxy
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api', routes)

app.listen(PORT, () => {
  console.info(`🚀 API server running on http://localhost:${PORT}`)
})
