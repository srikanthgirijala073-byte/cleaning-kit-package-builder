const mongoose = require('mongoose');
require('dotenv').config();

// =======================================================
// MongoDB connection - used ONLY for the RBAC auth system
// (Manager & Staff accounts). The rest of the application
// (customers, products, orders, etc.) continues to use the
// existing MySQL database in config/db.js.
// =======================================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleaning_kit_rbac';

let isConnected = false;

const connectMongo = async () => {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    });

    isConnected = true;
    console.log('MongoDB (RBAC) connected successfully!');
    return true;
  } catch (error) {
    console.warn('MongoDB (RBAC) connection failed. Attempting in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      isConnected = true;
      console.log('In-memory MongoDB (RBAC) server started and connected successfully!');
      return true;
    } catch (fallbackError) {
      console.error('MongoDB (RBAC) fallback connection failed:', fallbackError.message);
      return false;
    }
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

module.exports = { connectMongo, mongoose };
