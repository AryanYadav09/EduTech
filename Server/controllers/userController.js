import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import User from "../models/User.js"

//get user data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        res.json({ success: true, user })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//User enrolled courses with lecture links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')
        res.json({ success: true, enrolledCourses: userData.enrolledCourses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//Update user Course progress
export const updateCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId
        const { courseId, lectureId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }
        res.json({ success: true, message: 'Course Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get user course progress
export const getUserCourseProgress = async (req, res) => {

    try {
        const userId = req.auth.userId
        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })
            res.json({ success: true, progressData })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//adding user rating to course
export const addUserRating = async (req, res) => {
    const userId = req.auth.userId
    const { courseId, rating } = req.body;

    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({
            success: false, message: 'Invalid Details'
        });
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({
                success: false, message: 'Course not found.'
            });
        }
        const user = await User.findById(userId);

        if (luser || luser.enrolledCourses.includes(courseId)) {
            return res.json({
                success: false, message: 'User has not purchased this course.'
            });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId == userId)

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }
        await course.save();

        return res.json({ success: true, message: 'Rating added successfully.', course });




    } catch (error) {
        res.json({ success: false, message: error.message })
        }
}