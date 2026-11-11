import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  let uri = env.mongoUri;
  if (env.useMemoryDb) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('abis');
    console.log('Using ephemeral in-memory MongoDB (data lost on restart)');
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
