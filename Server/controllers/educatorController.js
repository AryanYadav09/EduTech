import { clerkClient } from '@clerk/express'
import Course from '../models/course';
import { v2 as cloudinary } from 'cloudinary'

// update role to education
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'education',
            }
        });
        res.json({ success: true, message: 'You can publish a course now' })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}   

// add course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if (!educatorId) return res.status(401).json({ success: false, message: 'Not authenticated' })
        if (!imageFile) return res.status(400).json({ success: false, message: 'Thumbnail not attached' })


        const parsedCourseData = JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({ success: true, message: 'Course Added'})
    
    }
    catch (error) {
        res.json({success: false, message: error.message})
        
    }
}
