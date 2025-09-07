import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Force HTTPS
    timeout: 60000, // Increase timeout to 60 seconds for large images
});

console.log("☁️  Cloudinary configured:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    timeout: "60000ms",
    secure: true
});

export default cloudinary;