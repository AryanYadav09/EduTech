import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";

const getPayableAmount = (coursePrice, discount) => {
    const price = Number(coursePrice) || 0;
    const discountValue = Number(discount) || 0;
    return Number((price - (discountValue * price) / 100).toFixed(2));
};

// Get All Courses
export const getAllCourse = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true }).select(['-courseContent', '-enrolledStudents']).populate({ path: 'educator' })

        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


//get Course by id
export const getCourseId = async (req, res) => {
    const { id } = req.params
    try {
        const courseData = await Course.findById(id).populate({ path: 'educator' })
        if (!courseData) {
            return res.status(404).json({ success: false, message: 'Course not found' })
        }

        const courseResponse = courseData.toObject();

        // Public course endpoint should not expose full lecture videos.
        courseResponse.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                lecture.lectureUrl = "";
            })
        });

        const raterIds = courseResponse.courseRatings.map((item) => item.userId);
        const ratingUsers = await User.find({ _id: { $in: raterIds } }).select(['name', 'imageUrl']);
        const userMap = new Map(ratingUsers.map((item) => [item._id.toString(), item]));

        const courseRatingDetails = courseResponse.courseRatings.map((item) => {
            const matchedUser = userMap.get(item.userId);
            return {
                userId: item.userId,
                rating: item.rating,
                userName: matchedUser?.name || 'Learner',
                userImage: matchedUser?.imageUrl || '',
            };
        });

        res.json({
            success: true,
            course: {
                ...courseResponse,
                payableAmount: getPayableAmount(courseResponse.coursePrice, courseResponse.discount),
                courseRatingDetails,
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const createCoursePurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'courseId is required' });
        }

        const [course, user] = await Promise.all([
            Course.findById(courseId),
            User.findById(userId),
        ]);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User profile not found' });
        }

        const alreadyEnrolled = user.enrolledCourses.some((id) => id.toString() === courseId);
        if (alreadyEnrolled) {
            return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
        }

        const amount = getPayableAmount(course.coursePrice, course.discount);

        const existingPendingPurchase = await Purchase.findOne({
            courseId,
            userId,
            status: 'pending',
        }).sort({ createdAt: -1 });

        if (existingPendingPurchase) {
            return res.json({
                success: true,
                purchaseId: existingPendingPurchase._id,
                amount: existingPendingPurchase.amount,
                courseId,
            });
        }

        const purchase = await Purchase.create({
            courseId,
            userId,
            amount,
            status: 'pending',
        });

        return res.json({
            success: true,
            purchaseId: purchase._id,
            amount: purchase.amount,
            courseId,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const confirmCoursePurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const { purchaseId, paymentMethod } = req.body;

        if (!purchaseId) {
            return res.status(400).json({ success: false, message: 'purchaseId is required' });
        }

        const purchase = await Purchase.findOne({ _id: purchaseId, userId });
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        if (purchase.status === 'completed') {
            return res.json({ success: true, message: 'Payment already confirmed', courseId: purchase.courseId });
        }

        const [course, user] = await Promise.all([
            Course.findById(purchase.courseId),
            User.findById(userId),
        ]);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User profile not found' });
        }

        const validPaymentMethods = ['card', 'upi', 'netbanking', 'wallet'];
        const selectedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'card';

        purchase.status = 'completed';
        purchase.paymentMethod = selectedPaymentMethod;
        purchase.transactionId = `TXN-${Date.now()}`;
        await purchase.save();

        await Promise.all([
            User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: course._id } }),
            Course.findByIdAndUpdate(course._id, { $addToSet: { enrolledStudents: userId } }),
        ]);

        return res.json({ success: true, message: 'Payment successful. You are now enrolled.', courseId: course._id });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
