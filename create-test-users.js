import { connectDB } from './src/config/db.js';
import User from './src/models/user.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testUsers = [
    {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
    },
    {
        fullName: 'Jane Smith',
        email: 'jane@example.com', 
        password: 'password123'
    },
    {
        fullName: 'Bob Wilson',
        email: 'bob@example.com',
        password: 'password123'
    },
    {
        fullName: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123'
    }
];

async function createTestUsers() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        console.log('Creating test users...');
        
        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists, skipping...`);
                continue;
            }
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            
            // Create user
            const newUser = new User({
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword
            });
            
            await newUser.save();
            console.log(`✅ Created user: ${userData.fullName} (${userData.email})`);
        }
        
        console.log('\n🎉 Test users created successfully!');
        console.log('\nYou can now log in with:');
        testUsers.forEach(user => {
            console.log(`- Email: ${user.email}, Password: ${user.password}`);
        });
        
    } catch (error) {
        console.error('Error creating test users:', error);
    } finally {
        process.exit(0);
    }
}

createTestUsers();
