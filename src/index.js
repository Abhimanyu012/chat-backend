import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
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

// CORS configuration
const baseOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

// Always include the Vercel production URL
const productionFrontend = "https://chat-frontend-nine-phi.vercel.app";

const devExtras = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];

const allowedOrigins = Array.from(new Set([
    ...baseOrigins,
    productionFrontend, // Always include the production frontend
    ...(process.env.NODE_ENV === 'production' ? [] : devExtras),
]));

console.log("CORS Allowed origins:", allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log("No origin provided, allowing request");
            return callback(null, true);
        }
        
        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            console.log(`Origin ${origin} is allowed by CORS`);
            return callback(null, true);
        }
        
        // Check for local development
        try {
            const u = new URL(origin);
            const isLocal = ["localhost", "127.0.0.1"].includes(u.hostname);
            const isViteDev = isLocal && ["5173", "5174", "4173", "4174"].includes(u.port);
            if (isViteDev) {
                console.log(`Local development origin ${origin} is allowed by CORS`);
                return callback(null, true);
            }
        } catch (err) {
            console.error("Error parsing origin URL:", err.message);
        }
        
        // Log denied origins for debugging
        console.log(`CORS denied for origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"]
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
const PORT = process.env.PORT || 4000;
// Increase body size limits to handle base64 image uploads
const JSON_LIMIT = process.env.JSON_LIMIT || "10mb";
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ limit: JSON_LIMIT, extended: true }));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Additional health check endpoint at /api/health for Render.com
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        console.log("CORS allowed origins:", allowedOrigins);
        console.log("JSON/URL-encoded limit:", JSON_LIMIT);
    });
}).catch((err) => {
    console.error("Failed to connect to database:", err);
});