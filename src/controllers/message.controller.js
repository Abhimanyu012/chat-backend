import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filterUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password")
        res.status(200).json(filterUsers)


    } catch (error) {
        console.error("Error in getUserForSidebar:", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChat } = req.params
        const myId = req.user._id

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

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const sendMessages = async (req, res) => {
    try {
        const { text, image } = req.body
        const { id: receiverId } = req.params
    const senderId = req.user._id


        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url
        }
        const newMessages = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        await newMessages.save()

        res.status(201).json(newMessages);
    } catch (error) {
        console.error("Error in sendMessages:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}