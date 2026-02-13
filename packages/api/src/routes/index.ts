import { Router } from 'express'
import gpxRoutes from './gpx'

const router = Router()

router.use('/gpx', gpxRoutes)

export default router
