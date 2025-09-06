import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },
    profilePic: {
        type: String,
        default: ""
    }
}, { 
    timestamps: true,
    // Add better error messages for duplicate key errors
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Handle duplicate key errors for unique fields like email
userSchema.post("save", function(error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        next(new Error("Email already exists. Please use a different email address."));
    } else {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);

export default User;