import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getOnlineUsers } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        console.log("👥 Starting getUsersForSidebar function");
        const startTime = Date.now();
        
        const loggedInUserId = req.user._id;
        console.log("🔍 Fetching users for logged in user:", loggedInUserId.toString());
        
        const dbQueryStartTime = Date.now();
        const filterUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        const dbQueryEndTime = Date.now();
        const dbQueryDuration = dbQueryEndTime - dbQueryStartTime;
        
        console.log("✅ Users fetched from database:", {
            dbQueryDuration: `${dbQueryDuration}ms`,
            userCount: filterUsers.length
        });
        
        // Get online users and add online status
        const onlineStatusStartTime = Date.now();
        const onlineUsers = getOnlineUsers();
        const usersWithOnlineStatus = filterUsers.map(user => ({
            ...user.toObject(),
            isOnline: onlineUsers.includes(user._id.toString())
        }));
        const onlineStatusEndTime = Date.now();
        const onlineStatusDuration = onlineStatusEndTime - onlineStatusStartTime;
        
        const onlineCount = usersWithOnlineStatus.filter(user => user.isOnline).length;
        console.log("✅ Online status processed:", {
            onlineStatusDuration: `${onlineStatusDuration}ms`,
            totalUsers: filterUsers.length,
            onlineUsers: onlineCount,
            offlineUsers: filterUsers.length - onlineCount,
            onlineUserIds: onlineUsers
        });
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log("🎯 getUsersForSidebar completed:", {
            totalDuration: `${totalDuration}ms`,
            breakdown: {
                dbQuery: `${dbQueryDuration}ms`,
                onlineStatus: `${onlineStatusDuration}ms`
            }
        });
        
        res.status(200).json(usersWithOnlineStatus);
    } catch (error) {
        console.error("💥 Error in getUserForSidebar:", {
            errorMessage: error.message,
            errorStack: error.stack,
            userId: req.user?._id?.toString()
        });
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
    try {
        console.log("💬 Starting getMessages function");
        const startTime = Date.now();
        
        const { id: userToChat } = req.params
        const myId = req.user._id

        console.log("🔍 Fetching messages between users:", {
            currentUser: myId.toString(),
            chatPartner: userToChat
        });

        const dbQueryStartTime = Date.now();
        const messages = await Message.find({
            $or: [
                {
                    senderId: myId,
                    receiverId: userToChat
                },
                {
                    senderId: userToChat,
                    receiverId: myId
                }
            ]
        });
        const dbQueryEndTime = Date.now();
        const dbQueryDuration = dbQueryEndTime - dbQueryStartTime;

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        console.log("✅ Messages retrieved successfully:", {
            totalDuration: `${totalDuration}ms`,
            dbQueryDuration: `${dbQueryDuration}ms`,
            messageCount: messages.length,
            hasImages: messages.filter(msg => msg.image).length
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("💥 Error in getMessages:", {
            errorMessage: error.message,
            errorStack: error.stack,
            userId: req.user?._id?.toString(),
            chatPartnerId: req.params?.id
        });
        res.status(500).json({ error: "Internal server error" });
    }
}

export const sendMessages = async (req, res) => {
    try {
        console.log("🚀 Starting sendMessages function");
        const requestStartTime = Date.now();
        
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        console.log("📝 Message details:", {
            senderId: senderId.toString(),
            receiverId,
            hasText: !!text,
            hasImage: !!image,
            imageSize: image ? `${(image.length / 1024).toFixed(2)}KB` : 'N/A'
        });

        let imageUrl;
        if (image) {
            console.log("🖼️  Starting image upload process");
            const imageUploadStartTime = Date.now();
            
            try {
                console.log("☁️  Uploading to Cloudinary...");
                // Optimize image upload with specific options
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    resource_type: "auto",
                    transformation: [
                        { quality: "auto:best" },
                        { fetch_format: "auto" },
                        { width: 800, height: 800, crop: "limit" } // Limit size for faster upload
                    ]
                });
                
                const imageUploadEndTime = Date.now();
                const uploadDuration = imageUploadEndTime - imageUploadStartTime;
                
                imageUrl = uploadResponse.secure_url;
                console.log("✅ Image upload successful:", {
                    uploadDuration: `${uploadDuration}ms`,
                    imageUrl: imageUrl.substring(0, 50) + '...',
                    cloudinaryResponse: {
                        public_id: uploadResponse.public_id,
                        format: uploadResponse.format,
                        width: uploadResponse.width,
                        height: uploadResponse.height,
                        bytes: uploadResponse.bytes
                    }
                });
            } catch (uploadError) {
                const imageUploadEndTime = Date.now();
                const uploadDuration = imageUploadEndTime - imageUploadStartTime;
                console.error("❌ Image upload failed:", {
                    uploadDuration: `${uploadDuration}ms`,
                    error: uploadError.message,
                    stack: uploadError.stack
                });
                return res.status(400).json({ error: "Failed to upload image" });
            }
        }

        console.log("💾 Creating and saving message to database...");
        const dbSaveStartTime = Date.now();
        
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();
        
        const dbSaveEndTime = Date.now();
        const dbSaveDuration = dbSaveEndTime - dbSaveStartTime;
        console.log("✅ Message saved to database:", {
            dbSaveDuration: `${dbSaveDuration}ms`,
            messageId: newMessage._id.toString()
        });

        // Populate sender info for real-time messaging
        console.log("👤 Populating sender information...");
        const populateStartTime = Date.now();
        await newMessage.populate("senderId", "fullName profilePic");
        const populateEndTime = Date.now();
        const populateDuration = populateEndTime - populateStartTime;
        console.log("✅ Sender info populated:", {
            populateDuration: `${populateDuration}ms`,
            senderName: newMessage.senderId.fullName
        });

        // Emit the message to the receiver via Socket.IO
        console.log("📡 Emitting message via Socket.IO...");
        const socketStartTime = Date.now();
        const { io } = await import("../lib/socket.js");
        const onlineUsers = (await import("../lib/socket.js")).getOnlineUsers();
        
        console.log("🔗 Socket.IO status:", {
            receiverId,
            isReceiverOnline: onlineUsers.includes(receiverId),
            totalOnlineUsers: onlineUsers.length,
            onlineUserIds: onlineUsers
        });
        
        if (onlineUsers.includes(receiverId)) {
            io.emit("newMessage", {
                ...newMessage.toObject(),
                receiverId
            });
            console.log("📤 Message emitted to online receiver");
        } else {
            console.log("📴 Receiver is offline, message will be delivered when they come online");
        }
        
        const socketEndTime = Date.now();
        const socketDuration = socketEndTime - socketStartTime;
        console.log("✅ Socket.IO processing completed:", {
            socketDuration: `${socketDuration}ms`
        });

        const requestEndTime = Date.now();
        const totalDuration = requestEndTime - requestStartTime;
        console.log("🎯 sendMessages completed successfully:", {
            totalDuration: `${totalDuration}ms`,
            breakdown: {
                imageUpload: image ? 'included' : 'skipped',
                dbSave: `${dbSaveDuration}ms`,
                populate: `${populateDuration}ms`, 
                socket: `${socketDuration}ms`
            }
        });

        res.status(201).json(newMessage);
    } catch (error) {
        const requestEndTime = Date.now();
        const errorDuration = requestEndTime - (typeof requestStartTime !== 'undefined' ? requestStartTime : requestEndTime);
        
        console.error("💥 Error in sendMessages:", {
            errorDuration: `${errorDuration}ms`,
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            userId: req.user?._id?.toString(),
            receiverId: req.params?.id
        });
        res.status(500).json({ error: "Internal server error" });
    }
}