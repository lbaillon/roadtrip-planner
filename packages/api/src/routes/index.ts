import { Router } from 'express'
import authRoutes from './auth.js'
import gpxRoutes from './gpx.js'
import tracksRoutes from './tracks.js'
import usersRoutes from './users.js'

const router: Router = Router()

router.use('/gpx', gpxRoutes)
router.use('/users', usersRoutes)
router.use('/tracks', tracksRoutes)
router.use('/auth', authRoutes)

router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default router
