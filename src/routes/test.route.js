import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const router = express.Router();

// Simple signup test endpoint that doesn't use JWT at all
router.post("/signup", async (req, res) => {
    try {
        console.log("Test signup request received:", JSON.stringify(req.body));
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

            // Create new user without any JWT handling
            const newUser = new User({
                fullName,
                email,
                password: hashPassword,
            });

            console.log("Saving new user:", { fullName, email });
            const savedUser = await newUser.save();
            console.log("User saved successfully with ID:", savedUser._id);
            
            return res.status(201).json({
                message: "User created successfully",
                user: {
                    _id: savedUser._id,
                    fullName: savedUser.fullName,
                    email: savedUser.email
                }
            });
        } catch (userSaveError) {
            console.error("Error saving user:", userSaveError);
            return res.status(500).json({ 
                message: "Error creating user account", 
                error: userSaveError.message,
                stack: process.env.NODE_ENV === 'development' ? userSaveError.stack : undefined
            });
        }
    } catch (error) {
        console.error("Error in test signup controller:", error);
        return res.status(500).json({ 
            message: "Internal server error during signup process", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
