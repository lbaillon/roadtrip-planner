import { Router } from 'express'
import gpxRoutes from './gpx.js'
import usersRoutes from './users.js'
import tracksRoutes from './tracks.js'

const router: Router = Router()

router.use('/gpx', gpxRoutes)
router.use('/users', usersRoutes)
router.use('/tracks', tracksRoutes)

export default router
