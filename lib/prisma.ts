import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

// Use native WebSocket if available (Node 18+, Vercel runtime), otherwise skip
if (typeof WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = WebSocket;
}

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

function getPrismaClient(): PrismaClient {
    if (!prisma) {
        const adapter = new PrismaNeon({ connectionString: connectionString! });
        prisma = new PrismaClient({ adapter });
    }
    return prisma;
}

export default getPrismaClient;
