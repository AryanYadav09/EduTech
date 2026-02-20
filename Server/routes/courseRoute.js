import express from 'express'
import { confirmCoursePurchase, createCoursePurchase, getAllCourse, getCourseId } from '../controllers/courseController.js'
import { protectUser } from '../middlewares/authMiddleware.js'

const courseRouter = express.Router()

courseRouter.post('/purchase', protectUser, createCoursePurchase)
courseRouter.post('/purchase/confirm', protectUser, confirmCoursePurchase)
courseRouter.get('/all', getAllCourse)
courseRouter.get('/:id', getCourseId)

export default courseRouter;
