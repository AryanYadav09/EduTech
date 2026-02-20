import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'
import Purchase from '../models/Purchase.js'
import User from '../models/User.js'

const normalizeList = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || '').trim()).filter(Boolean);
};

const sanitizeCourseContent = (courseContent = []) => {
    if (!Array.isArray(courseContent)) return [];

    return courseContent.map((chapter, chapterIndex) => {
        const chapterId = String(chapter?.chapterId || `chapter-${chapterIndex + 1}`);
        const chapterContent = Array.isArray(chapter?.chapterContent)
            ? chapter.chapterContent.map((lecture, lectureIndex) => ({
                lectureId: String(lecture?.lectureId || `${chapterId}-lecture-${lectureIndex + 1}`),
                lectureTitle: String(lecture?.lectureTitle || '').trim(),
                lectureDuration: Number(lecture?.lectureDuration) || 0,
                lectureUrl: String(lecture?.lectureUrl || '').trim(),
                isPreviewFree: Boolean(lecture?.isPreviewFree),
                lectureOrder: Number(lecture?.lectureOrder) || lectureIndex + 1,
            }))
            : [];

        return {
            chapterId,
            chapterOrder: Number(chapter?.chapterOrder) || chapterIndex + 1,
            chapterTitle: String(chapter?.chapterTitle || '').trim(),
            chapterContent,
        };
    });
};


export const updateRoleToEducator = async (req, res) => {
    try {
        const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
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
        const educatorId = req.userId

        if (!educatorId) return res.status(401).json({ success: false, message: 'Not authenticated' })
        if (!imageFile) return res.status(400).json({ success: false, message: 'Thumbnail not attached' })


        const parsedCourseData = JSON.parse(courseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        const sanitizedCourse = {
            courseTitle: String(parsedCourseData?.courseTitle || '').trim(),
            courseSubtitle: String(parsedCourseData?.courseSubtitle || '').trim(),
            courseDescription: String(parsedCourseData?.courseDescription || '').trim(),
            courseAbout: String(parsedCourseData?.courseAbout || '').trim(),
            courseIncludes: normalizeList(parsedCourseData?.courseIncludes),
            courseOutcomes: normalizeList(parsedCourseData?.courseOutcomes),
            courseRequirements: normalizeList(parsedCourseData?.courseRequirements),
            courseLevel: String(parsedCourseData?.courseLevel || 'All Levels').trim(),
            courseLanguage: String(parsedCourseData?.courseLanguage || 'English').trim(),
            coursePrice: Number(parsedCourseData?.coursePrice),
            discount: Number(parsedCourseData?.discount) || 0,
            courseContent: sanitizeCourseContent(parsedCourseData?.courseContent),
            courseThumbnail: imageUpload.secure_url,
            educator: educatorId,
        };

        if (!sanitizedCourse.courseTitle || !sanitizedCourse.courseDescription || !sanitizedCourse.courseAbout) {
            return res.status(400).json({ success: false, message: 'Course title, description and about section are required' });
        }

        if (!Number.isFinite(sanitizedCourse.coursePrice) || sanitizedCourse.coursePrice < 0) {
            return res.status(400).json({ success: false, message: 'Invalid course price' });
        }

        if (sanitizedCourse.discount < 0 || sanitizedCourse.discount > 100) {
            return res.status(400).json({ success: false, message: 'Discount must be between 0 and 100' });
        }

        if (sanitizedCourse.courseIncludes.length === 0) {
            return res.status(400).json({ success: false, message: 'Add at least one course include item' });
        }

        if (sanitizedCourse.courseContent.length === 0) {
            return res.status(400).json({ success: false, message: 'Add at least one chapter' });
        }

        const hasInvalidChapter = sanitizedCourse.courseContent.some((chapter) => {
            if (!chapter.chapterTitle || chapter.chapterContent.length === 0) return true;
            return chapter.chapterContent.some((lecture) => !lecture.lectureTitle || !lecture.lectureUrl || lecture.lectureDuration <= 0);
        });

        if (hasInvalidChapter) {
            return res.status(400).json({ success: false, message: 'Each chapter must contain valid lectures' });
        }

        await Course.create(sanitizedCourse)

        res.json({ success: true, message: 'Course Added'})
    
    }
    catch (error) {
        res.json({success: false, message: error.message})
        
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.userId
        const courses = await Course.find({ educator })
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get educator dashboard data

export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.userId;
        const courses = await Course.find({ educator });
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
        const educator = req.userId;
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
