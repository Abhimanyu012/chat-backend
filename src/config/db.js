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
        
        // Log for debugging (remove in production)
        console.log("MongoDB URI exists:", !!mongoURI);
        
        if (!mongoURI) {
            console.error("MongoDB URI is not defined in environment variables!");
            // Use a fallback for development only (not recommended for production)
            if (process.env.NODE_ENV !== 'production') {
                console.warn("Using fallback MongoDB URI for development");
                const fallbackURI = "mongodb+srv://abhimanyukumarssm0012:abhimanyu148@cluster0.vysj6xi.mongodb.net/";
                const conn = await mongoose.connect(fallbackURI);
                console.log("MongoDB connected (fallback)", conn.connection.host);
                return;
            } else {
                throw new Error("MongoDB URI is required in production!");
            }
        }
        
        const conn = await mongoose.connect(mongoURI);
        console.log("MongoDB connected:", conn.connection.host);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        // Don't exit in production, let the app continue to serve static content
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
}
