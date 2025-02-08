// lib/db.ts
import mongoose from 'mongoose';

export async function connectToDb() {
  if (!process.env.MONGO_URI) {
    throw new Error("Please define the MONGO_URI environment variable in .env.local");
  }

  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    console.log("Already connected to MongoDB.");
    return;
  }

  // Otherwise, connect
  await mongoose.connect(process.env.MONGO_URI, {
    // These options are for older Mongoose versions;
    // may not be necessary in Mongoose 7+ but won't hurt:
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any); // Type assertion to avoid TS config warnings

  console.log("Connected to MongoDB!");
}



