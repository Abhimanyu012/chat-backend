import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    // Use a default secret for development if JWT_SECRET is not set (NOT RECOMMENDED FOR PRODUCTION)
    const jwtSecret = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production";
    
    if (!jwtSecret) {
        console.error("JWT_SECRET environment variable is not set!");
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    
    if (!res || typeof res.cookie !== "function") {
        console.error("Invalid response object:", typeof res);
        throw new Error("Response object does not support cookie method.");
    }
    
    try {
        const token = jwt.sign({ userId }, jwtSecret, {
            expiresIn: "7d"
        });
        
        // Configure cookie settings based on environment
        const isProduction = process.env.NODE_ENV === "production";
        
        // For production environments, use SameSite=None with Secure to allow cross-domain cookies
        // This is necessary for Vercel frontend to Render backend communication
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax", // Use 'none' for cross-site in production
            secure: isProduction, // Must be true when sameSite is 'none'
            path: "/", // Ensure cookie is available across the site
            domain: isProduction ? undefined : undefined, // Use specific domain in production if needed
        });
        
        return token;
    } catch (error) {
        console.error("Error generating JWT token:", error);
        throw error;
    }
}