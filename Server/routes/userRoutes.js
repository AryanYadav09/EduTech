import express from 'express'
import { getUserCourseProgress, getUserData, updateCourseProgress, userEnrolledCourses } from '../controllers/userController'

const userRouter = express.Router()

userRouter.get('/data' , getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)


export default userRouter;