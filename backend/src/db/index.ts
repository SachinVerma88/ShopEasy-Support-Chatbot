import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';

const prisma = new PrismaClient();

let redisClient: RedisClientType | null = null;

/**
 * Returns a connected Redis client singleton.
 * Creates and connects the client on first call.
 * Uses TLS when REDIS_URL starts with rediss:// (e.g. Upstash).
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const useTls = url.startsWith('rediss://');

    redisClient = createClient(
      useTls ? { url, socket: { tls: true } } : { url }
    );

    redisClient.on('error', (err: Error) => {
      console.error('Redis client error:', err.message);
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Gracefully disconnects Prisma and Redis clients.
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();

  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

export { prisma };
