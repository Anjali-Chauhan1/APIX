import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.log('\n To start MongoDB locally:');
    console.log('   1. Install MongoDB from https://www.mongodb.com/try/download/community');
    console.log('   2. Start the MongoDB service');
    console.log('   3. Or use MongoDB Atlas cloud: https://www.mongodb.com/atlas\n');
    throw error;
  }
};

export default connectDB;
