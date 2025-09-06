import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    if (!res || typeof res.cookie !== "function") {
        throw new Error("Response object does not support cookie method.");
    }
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV && process.env.NODE_ENV !== "development"
    });
    return token;
}