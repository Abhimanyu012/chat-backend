
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    try {
        console.log("Signup request received:", JSON.stringify(req.body));
        console.log("Request headers:", JSON.stringify(req.headers));
        
        const { fullName, email, password } = req.body || {};

        if (!fullName || !email || !password) {
            console.log("Missing fields:", { fullName: !!fullName, email: !!email, password: !!password });
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            console.log("Password too short:", password.length);
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        try {
            // Check if user exists before creating
            console.log("Checking if email exists:", email);
            const existing = await User.findOne({ email });
            if (existing) {
                console.log("Email already exists:", email);
                return res.status(409).json({ message: "Email already exists" });
            }
            console.log("Email is available");
        } catch (dbError) {
            console.error("Database error checking existing user:", dbError);
            return res.status(500).json({ message: "Database error checking user existence", error: dbError.message });
        }

        try {
            // Hash password
            console.log("Hashing password");
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            console.log("Password hashed successfully");

            // Create new user
            const newUser = new User({
                fullName,
                email,
                password: hashPassword,
            });

            console.log("Saving new user:", { fullName, email });
            await newUser.save();
            console.log("User saved successfully with ID:", newUser._id);
            
            // Set JWT cookie
            try {
                console.log("Generating JWT token");
                generateToken(newUser._id, res);
                console.log("JWT token generated successfully");
            } catch (tokenError) {
                console.error("Token generation error:", tokenError);
                return res.status(500).json({ message: "Error generating authentication token", error: tokenError.message });
            }

            console.log("Sending success response");
            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } catch (userSaveError) {
            console.error("Error saving user:", userSaveError);
            return res.status(500).json({ message: "Error creating user account", error: userSaveError.message });
        }
    } catch (error) {
        console.error("Error in signup controller:", error.message);
        console.error("Full error stack:", error.stack);
        return res.status(500).json({ 
            message: "Internal server error during signup process", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateToken(user._id, res);
        return res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("jwt", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV && process.env.NODE_ENV !== "development" });
        return res.status(200).json({ message: "Logged out" });
    } catch (error) {
        console.log("Error in logout controller:", error.stack);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {  
    try {
        console.log("🔄 Starting updateProfile function");
        const requestStartTime = Date.now();
        
        const { profilePic } = req.body;
        const userId = req.user?._id;
        
        console.log("📋 Profile update request details:", {
            userId: userId?.toString(),
            hasProfilePic: !!profilePic,
            profilePicSize: profilePic ? `${(profilePic.length / 1024).toFixed(2)}KB` : 'N/A'
        });
        
        if (!userId) {
            console.log("❌ Unauthorized: No user ID found");
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        if (!profilePic) {
            console.log("❌ Bad Request: No profile picture provided");
            return res.status(400).json({ message: "Profile picture is required" });
        }
        
        console.log("☁️  Starting Cloudinary upload for profile picture");
        const uploadStartTime = Date.now();
        
        // Upload with optimizations for profile pictures
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            resource_type: "auto",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" }, // Square crop focused on face
                { quality: "auto:good" }, // Good quality but optimized
                { fetch_format: "auto" } // Auto format (WebP when supported)
            ],
            folder: "chat-app/profiles", // Organize uploads
            allowed_formats: ["jpg", "jpeg", "png", "webp"]
        });
        
        const uploadEndTime = Date.now();
        const uploadDuration = uploadEndTime - uploadStartTime;
        
        console.log("✅ Cloudinary upload successful:", {
            uploadDuration: `${uploadDuration}ms`,
            imageUrl: uploadResponse.secure_url.substring(0, 50) + '...',
            cloudinaryResponse: {
                public_id: uploadResponse.public_id,
                format: uploadResponse.format,
                width: uploadResponse.width,
                height: uploadResponse.height,
                bytes: uploadResponse.bytes
            }
        });
        
        console.log("💾 Updating user profile in database");
        const dbUpdateStartTime = Date.now();
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        ).select("-password");
        
        const dbUpdateEndTime = Date.now();
        const dbUpdateDuration = dbUpdateEndTime - dbUpdateStartTime;
        
        console.log("✅ Database update completed:", {
            dbUpdateDuration: `${dbUpdateDuration}ms`,
            userFound: !!updatedUser
        });
        
        if (!updatedUser) {
            console.log("❌ User not found in database");
            return res.status(404).json({ message: "User not found" });
        }
        
        const requestEndTime = Date.now();
        const totalDuration = requestEndTime - requestStartTime;
        
        console.log("🎯 updateProfile completed successfully:", {
            totalDuration: `${totalDuration}ms`,
            breakdown: {
                cloudinaryUpload: `${uploadDuration}ms`,
                dbUpdate: `${dbUpdateDuration}ms`
            },
            userId: userId.toString(),
            newProfilePic: updatedUser.profilePic.substring(0, 50) + '...'
        });
        
        return res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
        });
    } catch (error) {
        const requestEndTime = Date.now();
        const errorDuration = requestEndTime - (typeof requestStartTime !== 'undefined' ? requestStartTime : requestEndTime);
        
        console.error("💥 Error in updateProfile controller:", {
            errorDuration: `${errorDuration}ms`,
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            userId: req.user?._id?.toString()
        });
        
        // Handle specific Cloudinary errors
        if (error.name === 'Error' && error.message.includes('Invalid image')) {
            return res.status(400).json({ message: "Invalid image format. Please upload a valid image file." });
        }
        
        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error("⏰ Timeout error in updateProfile:", {
                timeout: true,
                errorCode: error.code
            });
            return res.status(408).json({ message: "Request timeout. Please try again with a smaller image." });
        }
        
        return res.status(500).json({ 
            message: "Internal server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
}
 
export const checkAuth = async (req,res)=>{
    try{
        res.status(200).json(req.user)

    }catch(error){
        console.log("Error in checkAuth controller",error.message)
    }
}