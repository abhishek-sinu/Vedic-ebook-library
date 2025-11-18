import mongoose from 'mongoose';
import Grid from 'gridfs-stream';

let gfs, gridfsBucket;

export const connectDatabase = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize GridFS
    const db = conn.connection.db;
    
    // GridFS Stream (for compatibility)
    gfs = Grid(db, mongoose.mongo);
    gfs.collection('books');
    
    // GridFS Bucket (modern approach)
    gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'books'
    });

    console.log('📚 GridFS initialized for book storage');
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Export GridFS instances
export const getGfs = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call connectDatabase first.');
  }
  return gfs;
};

export const getGridfsBucket = () => {
  if (!gridfsBucket) {
    throw new Error('GridFS Bucket not initialized. Call connectDatabase first.');
  }
  return gridfsBucket;
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', message: 'Database connection is active' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
};

// Graceful database disconnection
export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
};