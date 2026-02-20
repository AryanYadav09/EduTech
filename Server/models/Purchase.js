import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    status: {
        type: String, enum: ['pending', 'completed',
            'failed'], default: 'pending'
    }
}, { timestamps: true })

const Purchase = mongoose.model('Purchase', PurchaseSchema)

export default Purchase;
