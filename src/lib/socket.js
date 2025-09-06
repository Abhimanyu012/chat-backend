import { Server } from "socket.io"
import http from "http";
import express from "express";

const app = express()
const server = http.createServer(app)

// Get allowed origins from environment variables
const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [process.env.CLIENT_URL || "http://localhost:5173"];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
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
