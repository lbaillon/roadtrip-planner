import { Router, type Router as RouterType } from 'express'
import gpxRoutes from './gpx.js'

const router: RouterType = Router()

router.use('/gpx', gpxRoutes)

export default router
