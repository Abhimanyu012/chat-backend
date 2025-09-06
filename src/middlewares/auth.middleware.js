import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token Provided" })
        }
        // Example usage of jwt to verify token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret not configured" })
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized - Invalid or expired token" })
        }

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" })
        }
        const user = await User.findById(decoded.userId).select("-password")
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        req.user = user
        next()
    } catch (error) {
        console.log("Error in protected middleware")
        return res.status(401).json({ message: "Unauthorized - Invalid token" })
    }
}