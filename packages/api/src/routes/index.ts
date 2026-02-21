import { Router, type Router as RouterType } from 'express'
import gpxRoutes from './gpx.js'
import usersRoutes from './users.js'

const router: RouterType = Router()

router.use('/gpx', gpxRoutes)
router.use('/users', usersRoutes)


export default router
