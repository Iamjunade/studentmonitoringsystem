import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environments (Vercel serverless)
neonConfig.webSocketConstructor = ws;

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
