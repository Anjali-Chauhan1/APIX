import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connection successful');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed');
        console.error(err);
        process.exit(1);
    }
};

test();
