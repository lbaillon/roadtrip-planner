import { Router } from 'express'
import gpxRoutes from './gpx.js'

const router = Router()

router.use('/gpx', gpxRoutes)

export default router
