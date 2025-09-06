import { Server } from "socket.io"
import http from "http";
import express from "express";

const app = express()
const server = http.createServer(app)

const allowedOrigins = [
    "https://chat-frontend-nine-phi.vercel.app",
    "https://chat-frontend-git-main-abhimanyukumars-projects.vercel.app",
    "https://chat-frontend-abhimanyukumars-projects.vercel.app",
    "http://localhost:5173",
];

console.log("Socket.io CORS allowed origins:", allowedOrigins);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    }
});

// Example usage: listen for connections
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("A user is disconnected", socket.id)
    })
});

export { io, app, server };
