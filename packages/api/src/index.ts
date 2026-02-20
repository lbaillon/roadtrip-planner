import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import routes from './routes/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api', routes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.info(`🚀 API server running on http://localhost:${PORT}`)
})
