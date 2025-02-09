import mongoose from 'mongoose';

export async function connectToDb() {
  if (!process.env.MONGO_URI) {
    throw new Error("Please define the MONGO_URI environment variable in .env.local");
  }

  if (mongoose.connection.readyState === 1) {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    console.log("Already connected to MongoDB.");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  console.log("Connected to MongoDB!");
}



