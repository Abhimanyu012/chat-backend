import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
dotenv.config();
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

// CORS configuration
const baseOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const devExtras = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];
const allowedOrigins = Array.from(new Set([
    ...baseOrigins,
    ...(process.env.NODE_ENV === 'production' ? [] : devExtras),
]));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        try {
            const u = new URL(origin);
            const isLocal = ["localhost", "127.0.0.1"].includes(u.hostname);
            const isViteDev = isLocal && ["5173", "5174", "4173", "4174"].includes(u.port);
            if (isViteDev) return callback(null, true);
        } catch { }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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