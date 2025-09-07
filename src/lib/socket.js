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

// Store online users
const userSocketMap = {}; // {userId: socketId}

// Helper function to get online users
const getOnlineUsers = () => {
    return Object.keys(userSocketMap);
};

// Socket.IO connection handling
io.on("connection", (socket) => {
    const connectionStartTime = Date.now();
    console.log("🔌 New socket connection:", {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        remoteAddress: socket.handshake.address
    });
    
    const userId = socket.handshake.query.userId;
    if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        console.log("✅ User registered as online:", {
            userId: userId,
            socketId: socket.id,
            totalOnlineUsers: Object.keys(userSocketMap).length
        });
    } else {
        console.log("⚠️  User connected without userId");
    }
    
    // Emit the list of online users to all connected clients
    const emitStartTime = Date.now();
    const onlineUsers = Object.keys(userSocketMap);
    io.emit("getOnlineUsers", onlineUsers);
    const emitEndTime = Date.now();
    console.log("📡 Online users list broadcasted:", {
        emitDuration: `${emitEndTime - emitStartTime}ms`,
        onlineUserCount: onlineUsers.length,
        onlineUsers: onlineUsers
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        const disconnectStartTime = Date.now();
        console.log("🔌 Socket disconnection:", {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
        
        // Remove user from online users
        let disconnectedUserId = null;
        for (const [userId, socketId] of Object.entries(userSocketMap)) {
            if (socketId === socket.id) {
                delete userSocketMap[userId];
                disconnectedUserId = userId;
                console.log("❌ User went offline:", {
                    userId: userId,
                    socketId: socket.id,
                    remainingOnlineUsers: Object.keys(userSocketMap).length
                });
                break;
            }
        }
        
        if (!disconnectedUserId) {
            console.log("⚠️  Disconnected socket had no associated userId");
        }
        
        // Emit updated online users list
        const emitStartTime = Date.now();
        const onlineUsers = Object.keys(userSocketMap);
        io.emit("getOnlineUsers", onlineUsers);
        const emitEndTime = Date.now();
        const disconnectEndTime = Date.now();
        
        console.log("📡 Updated online users list broadcasted after disconnect:", {
            emitDuration: `${emitEndTime - emitStartTime}ms`,
            totalDisconnectDuration: `${disconnectEndTime - disconnectStartTime}ms`,
            onlineUserCount: onlineUsers.length,
            onlineUsers: onlineUsers
        });
    });
    
    // Handle new message
    socket.on("newMessage", (data) => {
        const messageStartTime = Date.now();
        console.log("💬 Received newMessage event:", {
            socketId: socket.id,
            data: data
        });
        
        const { receiverId, message } = data;
        const receiverSocketId = userSocketMap[receiverId];
        
        if (receiverSocketId) {
            const emitStartTime = Date.now();
            // Send message to specific user
            io.to(receiverSocketId).emit("newMessage", message);
            const emitEndTime = Date.now();
            
            console.log("📤 Message sent to receiver:", {
                receiverId: receiverId,
                receiverSocketId: receiverSocketId,
                emitDuration: `${emitEndTime - emitStartTime}ms`,
                messageId: message._id || 'unknown'
            });
        } else {
            console.log("📴 Receiver not online:", {
                receiverId: receiverId,
                availableOnlineUsers: Object.keys(userSocketMap)
            });
        }
        
        const messageEndTime = Date.now();
        console.log("✅ newMessage event processing completed:", {
            totalDuration: `${messageEndTime - messageStartTime}ms`
        });
    });
    
    const connectionEndTime = Date.now();
    console.log("🎯 Socket connection setup completed:", {
        setupDuration: `${connectionEndTime - connectionStartTime}ms`,
        userId: userId !== "undefined" ? userId : 'anonymous',
        socketId: socket.id
    });
});

export { io, app, server, getOnlineUsers };
