import { Router } from 'express'
import authRoutes from './auth.js'
import gpxRoutes from './gpx.js'
import tracksRoutes from './tracks.js'
import tripRoutes from './trips.js'
import usersRoutes from './users.js'

const router: Router = Router()

router.use('/users', usersRoutes)
router.use('/auth', authRoutes)
router.use('/gpx', gpxRoutes)
router.use('/tracks', tracksRoutes)
router.use('/trips', tripRoutes)

router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default router
