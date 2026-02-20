import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: true },
    lectureUrl: { type: String, required: true },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true }
}, { _id: false });

const chapterSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: [lectureSchema]
}, { _id: false });

const courseschema = new mongoose.Schema({
    courseTitle: { type: String, required: true },
    courseSubtitle: { type: String, default: "" },
    courseDescription: { type: String, required: true },
    courseAbout: { type: String, default: "" },
    courseIncludes: [{ type: String }],
    courseOutcomes: [{ type: String }],
    courseRequirements: [{ type: String }],
    courseLevel: { type: String, default: "All Levels" },
    courseLanguage: { type: String, default: "English" },
    courseThumbnail: { type: String },
    coursePrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    courseContent: [chapterSchema],
    courseRatings: [
        { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } }
    ],
    educator: { type: String, ref: 'User', required: true },
    enrolledStudents: [
        { type: String, ref: 'User' }
    ],
},{ timestamps: true, minimize: false });

const Course = mongoose.model('Course', courseschema);

export default Course;
