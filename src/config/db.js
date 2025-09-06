import mongoose from "mongoose"
import dotenv from "dotenv";

// Load environment variables from .env file if in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

export const connectDB = async () => {
    try {
        // Get MongoDB URI from environment variables
        const mongoURI = process.env.MONGODB_URI;
        
        // Log for debugging
        console.log("MongoDB URI exists:", !!mongoURI);
        if (!mongoURI) {
            console.error("⚠️ MongoDB URI is not defined in environment variables!");
        } else {
            // Mask the password in logs
            const maskedURI = mongoURI.replace(/:([^@]+)@/, ':****@');
            console.log("MongoDB URI format:", maskedURI);
        }
        
        let connectionString = mongoURI;
        
        if (!connectionString) {
            console.error("MongoDB URI is not defined in environment variables!");
            // Use a fallback for development only (not recommended for production)
            if (process.env.NODE_ENV !== 'production') {
                console.warn("Using fallback MongoDB URI for development");
                connectionString = "mongodb+srv://abhimanyukumarssm0012:abhimanyu148@cluster0.vysj6xi.mongodb.net/chatapp?retryWrites=true&w=majority";
            } else {
                throw new Error("MongoDB URI is required in production!");
            }
        }
        
        // Add specific connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
        };
        
        console.log("Attempting to connect to MongoDB...");
        const conn = await mongoose.connect(connectionString, options);
        console.log("✅ MongoDB connected successfully:", conn.connection.host);
        console.log("Database name:", conn.connection.name);
        
        // Set up error handling
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        return conn;
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        console.error("Full error:", error);
        
        // Don't exit in production, let the app continue to serve static content
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
}
