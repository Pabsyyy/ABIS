import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { BackupLog } from '../models/BackupLog';
import { Types } from 'mongoose';

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

async function ensureDir(): Promise<void> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

const COLLECTION_ORDER = [
  'users',
  'residents',
  'households',
  'puroks',
  'classifications',
  'certificatetypes',
  'certificaterequests',
  'issuedcertificates',
  'payments',
  'servicecategories',
  'servicerecords',
  'activitylogs',
  'notifications',
  'smslogs',
  'systemsettings',
  'backuplogs',
];

export async function createBackup(userId: Types.ObjectId | undefined): Promise<{ filename: string; sizeBytes: number }> {
  await ensureDir();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `abis-backup-${stamp}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  try {
    const collections: Record<string, unknown[]> = {};
    for (const name of COLLECTION_ORDER) {
      const exists = await db.listCollections({ name }).hasNext();
      collections[name] = exists ? await db.collection(name).find({}).toArray() : [];
    }
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), database: mongoose.connection.name, collections }, null, 2);
    await fs.writeFile(filePath, payload, 'utf8');
    const stats = await fs.stat(filePath);

    await BackupLog.create({ filename, path: filePath, sizeBytes: stats.size, createdBy: userId, status: 'success', type: 'full' });
    return { filename, sizeBytes: stats.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await BackupLog.create({ filename, path: filePath, createdBy: userId, status: 'failed', type: 'full', error: message }).catch(() => undefined);
    throw error;
  }
}

export async function listBackups() {
  return BackupLog.find().sort({ createdAt: -1 }).limit(50);
}

export async function listBackupFiles(): Promise<{ filename: string; sizeBytes: number; createdAt: Date }[]> {
  await ensureDir();
  const entries = await fs.readdir(BACKUPS_DIR);
  const files = await Promise.all(
    entries
      .filter((name) => name.endsWith('.json'))
      .map(async (name) => {
        const stats = await fs.stat(path.join(BACKUPS_DIR, name));
        return { filename: name, sizeBytes: stats.size, createdAt: stats.birthtime };
      })
  );
  return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function restoreBackup(filename: string, userId: Types.ObjectId | undefined): Promise<{ restored: Record<string, number> }> {
  if (filename.includes('..') || path.basename(filename) !== filename) {
    throw new Error('Invalid backup filename');
  }
  const filePath = path.join(BACKUPS_DIR, filename);
  const raw = await fs.readFile(filePath, 'utf8');
  const payload = JSON.parse(raw) as { collections?: Record<string, unknown[]> };
  if (!payload.collections || typeof payload.collections !== 'object') {
    throw new Error('Backup file is missing collections data');
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const restored: Record<string, number> = {};
  for (const [name, docs] of Object.entries(payload.collections)) {
    if (!COLLECTION_ORDER.includes(name) || !Array.isArray(docs)) continue;
    await db.collection(name).deleteMany({});
    if (docs.length > 0) {
      await db.collection(name).insertMany(docs as Record<string, unknown>[], { ordered: false });
    }
    restored[name] = docs.length;
  }

  await BackupLog.create({ filename, path: filePath, createdBy: userId, status: 'success', type: 'full' });
  return { restored };
}

export function backupsDir(): string {
  return BACKUPS_DIR;
}

export function nodeEnvExposesBackups(): boolean {
  return env.nodeEnv !== 'production';
}
