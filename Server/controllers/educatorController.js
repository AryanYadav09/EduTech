import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'
import Purchase from '../models/Purchase.js'
import User from '../models/User.js'
import { CourseProgress } from '../models/CourseProgress.js'

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

const buildSanitizedCourseData = (parsedCourseData, educatorId, courseThumbnail) => ({
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
    courseThumbnail,
    educator: educatorId,
});

const validateCourseData = (sanitizedCourse) => {
    if (!sanitizedCourse.courseTitle || !sanitizedCourse.courseDescription || !sanitizedCourse.courseAbout) {
        return 'Course title, description and about section are required';
    }

    if (!sanitizedCourse.courseThumbnail) {
        return 'Course thumbnail is required';
    }

    if (!Number.isFinite(sanitizedCourse.coursePrice) || sanitizedCourse.coursePrice < 0) {
        return 'Invalid course price';
    }

    if (sanitizedCourse.discount < 0 || sanitizedCourse.discount > 100) {
        return 'Discount must be between 0 and 100';
    }

    if (sanitizedCourse.courseIncludes.length === 0) {
        return 'Add at least one course include item';
    }

    if (sanitizedCourse.courseContent.length === 0) {
        return 'Add at least one chapter';
    }

    const hasInvalidChapter = sanitizedCourse.courseContent.some((chapter) => {
        if (!chapter.chapterTitle || chapter.chapterContent.length === 0) return true;
        return chapter.chapterContent.some((lecture) => !lecture.lectureTitle || !lecture.lectureUrl || lecture.lectureDuration <= 0);
    });

    if (hasInvalidChapter) {
        return 'Each chapter must contain valid lectures';
    }

    return null;
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

        let parsedCourseData;
        try {
            parsedCourseData = JSON.parse(courseData);
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Invalid course data payload' });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        const sanitizedCourse = buildSanitizedCourseData(parsedCourseData, educatorId, imageUpload.secure_url);
        const validationError = validateCourseData(sanitizedCourse);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
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

// Get single educator course by id
export const getEducatorCourseById = async (req, res) => {
    try {
        const educator = req.userId;
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, educator });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        return res.json({ success: true, course });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update educator course
export const updateEducatorCourse = async (req, res) => {
    try {
        const educator = req.userId;
        const { id } = req.params;
        const { courseData } = req.body;
        const imageFile = req.file;

        const existingCourse = await Course.findOne({ _id: id, educator });
        if (!existingCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!courseData) {
            return res.status(400).json({ success: false, message: 'courseData is required' });
        }

        let parsedCourseData;
        try {
            parsedCourseData = JSON.parse(courseData);
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Invalid course data payload' });
        }

        let courseThumbnail = existingCourse.courseThumbnail;
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path);
            courseThumbnail = imageUpload.secure_url;
        }

        const sanitizedCourse = buildSanitizedCourseData(parsedCourseData, educator, courseThumbnail);
        const validationError = validateCourseData(sanitizedCourse);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        await Course.findByIdAndUpdate(id, sanitizedCourse);

        return res.json({ success: true, message: 'Course Updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete educator course
export const deleteEducatorCourse = async (req, res) => {
    try {
        const educator = req.userId;
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, educator });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        await Promise.all([
            Course.deleteOne({ _id: id }),
            Purchase.deleteMany({ courseId: id }),
            CourseProgress.deleteMany({ courseId: id }),
            User.updateMany({}, { $pull: { enrolledCourses: id } }),
        ]);

        return res.json({ success: true, message: 'Course Deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
