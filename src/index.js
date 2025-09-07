import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/user.model.js";
import { connectDB } from "./config/db.js";

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with multiple fallbacks
dotenv.config(); // Load from .env
dotenv.config({ path: path.resolve(__dirname, '../.env.production') }); // Load from .env.production
dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // Load from .env.local

// Log environment for debugging
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

const corsOptions = {
  origin: [
    "https://chat-frontend-nine-phi.vercel.app",
    "https://chat-frontend-git-main-abhimanyukumars-projects.vercel.app",
    "https://chat-frontend-abhimanyukumars-projects.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// Debug middleware to log CORS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS' || req.headers.origin) {
    console.log(`CORS Request: ${req.method} ${req.path} from origin: ${req.headers.origin}`);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

const PORT = process.env.PORT || 5000;

// Test route to check if server is running
app.get("/test", (req, res) => {
  res.send("Server is running");
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    mongoConnected: !!mongoose.connection.readyState
  });
});

// Additional health check endpoint at /api/health for Render.com
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    mongoConnected: !!mongoose.connection.readyState
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    console.log(`MongoDB connection state: ${states[dbState]}`);
    
    // Test connection by running a simple query
    let result = "No test performed";
    let connectionSuccess = false;
    
    if (dbState === 1) { // If connected
      try {
        result = await mongoose.connection.db.command({ ping: 1 });
        connectionSuccess = true;
      } catch (pingError) {
        result = `Ping error: ${pingError.message}`;
      }
    }
    
    return res.status(200).json({
      status: 'ok',
      mongoConnected: dbState === 1,
      connectionState: states[dbState],
      ping: result,
      envVariables: {
        MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message,
      mongoConnected: false,
      connectionState: mongoose.connection.readyState !== undefined ? 
        ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] : 
        'unknown',
      envVariables: {
        MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET
      }
    });
  }
});

// Simple user creation test (bypassing JWT)
app.post('/api/test-create-user', async (req, res) => {
  try {
    console.log("Test create user request received:", JSON.stringify(req.body));
    
    const { fullName, email, password } = req.body || {};
    
    if (!fullName || !email || !password) {
      console.log("Missing fields in test:", { fullName: !!fullName, email: !!email, password: !!password });
      return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
      // Log DB connection state
      const dbState = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.log(`MongoDB connection state during test: ${states[dbState]}`);
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      
      // Try to create user without saving yet
      const newUser = new User({
        fullName,
        email,
        password: hashPassword,
      });
      
      // Validate the model before saving
      const validationError = newUser.validateSync();
      if (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.errors 
        });
      }
      
      // Try to save to database
      console.log("Attempting to save test user...");
      const savedUser = await newUser.save();
      console.log("Test user saved successfully with ID:", savedUser._id);
      
      // Return success without JWT
      return res.status(201).json({
        message: "Test user created successfully",
        userId: savedUser._id,
        email: savedUser.email
      });
    } catch (dbError) {
      console.error("Database error in test user creation:", dbError);
      return res.status(500).json({
        message: "Database error during test user creation",
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error("Error in test user creation:", error);
    return res.status(500).json({
      message: "Internal server error during test user creation",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/message", messageRoutes); // Alias for frontend compatibility

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        console.log("CORS allowed origins:", corsOptions.origin);
    });
}).catch((err) => {
    console.error("Failed to connect to database:", err);
});