import { Server } from "socket.io"
import http from "http";
import express from "express";

const app = express()
const server = http.createServer(app)

// Get allowed origins from environment variables
const baseOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

// Always include the Vercel production URLs
const productionFrontends = [
    "https://chat-frontend-nine-phi.vercel.app",
    "https://chat-frontend-git-main-abhimanyukumars-projects.vercel.app",
    "https://chat-frontend-abhimanyukumars-projects.vercel.app",
    // Include all possible subdomains
    "https://*.vercel.app"
];

const devExtras = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];

// In production, be more permissive for debugging
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['*'] // Allow all origins in production for debugging
    : Array.from(new Set([
        ...baseOrigins,
        ...productionFrontends,
        ...devExtras,
      ]));

console.log("Socket.io CORS allowed origins:", allowedOrigins);

const io = new Server(server, {
    cors: process.env.NODE_ENV === 'production' ? {
        // Super permissive CORS config for production debugging
        origin: '*',
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    } : {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(`Socket.io CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }
})

// Example usage: listen for connections
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("A user is disconnected", socket.id)
    })
});

export { io, app, server };
