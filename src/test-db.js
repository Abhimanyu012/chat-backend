import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.production' });

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://abhimanyukumarssm0012:abhimanyu148@cluster0.vysj6xi.mongodb.net/chatapp?retryWrites=true&w=majority';

console.log('MongoDB URI exists:', !!mongoURI);
console.log('Testing connection to MongoDB...');

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
})
    .then(() => {
        console.log('✅ MongoDB connected successfully!');
        console.log('Connection details:', {
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
        });
        
        // Test a simple operation
        return mongoose.connection.db.command({ ping: 1 });
    })
    .then(result => {
        console.log('Ping test result:', result);
        console.log('Database is fully operational!');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Full error:', err);
    })
    .finally(() => {
        console.log('Closing connection...');
        mongoose.connection.close();
        console.log('Test complete.');
    });
