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

// Always include the Vercel production URL
const productionFrontend = "https://chat-frontend-nine-phi.vercel.app";

// Combined allowed origins
const allowedOrigins = [...baseOrigins, productionFrontend];

console.log("Socket.io CORS allowed origins:", allowedOrigins);

const io = new Server(server, {
    cors: {
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
