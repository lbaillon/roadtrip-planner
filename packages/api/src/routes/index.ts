import { authenticate, authorize } from '#api/middlewares/auth.js'
import { Router } from 'express'
import authRoutes from './auth.js'
import gpxRoutes from './gpx.js'
import usersRoutes from './users.js'
import tracksRoutes from './tracks.js'

const router: Router = Router()

router.use('/gpx', gpxRoutes)
router.use('/users', usersRoutes)
router.use('/tracks', tracksRoutes)
router.use('/auth', authRoutes)

// TODO: to delete, this is a test
router.get('/testauth', authenticate, authorize(['admin']), (req, res) => {
  res.json({
    message: `Protected data for user ${JSON.stringify(req.user, Object.getOwnPropertyNames(req.user), 2)}}`,
  })
})

router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default router
