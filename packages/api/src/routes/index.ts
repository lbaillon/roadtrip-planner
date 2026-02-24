import { Router } from 'express'
import gpxRoutes from './gpx.js'
import usersRoutes from './users.js'

const router: Router = Router()

router.use('/gpx', gpxRoutes)
router.use('/users', usersRoutes)

export default router
