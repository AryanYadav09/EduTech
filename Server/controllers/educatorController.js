import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'
import Purchase from '../models/Purchase.js'
import User from '../models/User.js'


export const updateRoleToEducator = async (req, res) => {
    try {
        const auth = (typeof req.auth === 'function') ? req.auth() : req.auth;
        const userId = auth?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        // Use updateUser (most stable across Clerk versions)
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role: 'educator' }
        });

        return res.json({ success: true, message: 'You can publish a course now' });
    } catch (error) {
        console.error('updateRoleToEducator error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


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

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId
        const courses = await Course.find({ educator })
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get educator dashboard data

export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find(({educator}));
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled student IDs with their course titles
        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({success: true, dashboardData:{
            totalCourses, totalEarnings, enrolledStudentsData
        }  });
        
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get educator students data

export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createAt
        }));

        res.json({ success: true, enrolledStudents });

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}