import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { User } from './models/User';

async function main() {
  await connectDatabase();

  if (env.useMemoryDb) {
    const existing = await User.findOne({ username: env.seed.secretaryUsername });
    if (!existing) {
      const passwordHash = await bcrypt.hash(env.seed.secretaryPassword, 12);
      await User.create({
        username: env.seed.secretaryUsername,
        fullName: env.seed.secretaryFullName,
        passwordHash,
        role: 'secretary',
        mustChangePassword: true,
      });
      console.log(`In-memory dev database: created initial secretary account "${env.seed.secretaryUsername}"`);
    }
  }

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(env.port, () => {
    console.log(`ABIS backend listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
