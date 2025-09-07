import mongoose from "mongoose";

//conntect to the mongoDB database

const connectDB = async () => {
    mongoose.connection.on("connected", () => console.log("MongoDB connected"));

    await mongoose.connect(`${process.env.MONGODB_URI}/EduTech`, )
    
}

export default connectDB;