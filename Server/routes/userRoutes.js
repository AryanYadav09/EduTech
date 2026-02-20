import express from 'express'
import { addUserRating, getUserCourseProgress, getUserData, updateCourseProgress, userEnrolledCourses } from '../controllers/userController.js'
import { protectUser } from '../middlewares/authMiddleware.js'

const userRouter = express.Router()

userRouter.get('/data' , protectUser, getUserData);
userRouter.get('/enrolled-courses', protectUser, userEnrolledCourses)
userRouter.post('/update-course-progress', protectUser, updateCourseProgress)
userRouter.post('/get-course-progress', protectUser, getUserCourseProgress)
userRouter.post('/add-rating', protectUser, addUserRating)


export default userRouter;
