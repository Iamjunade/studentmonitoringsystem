import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query;
    const { name, parentPhone, studentPhone } = req.body;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: "Missing required student ID" });
    }

    try {
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(parentPhone && { parentPhone }),
                ...(studentPhone && { studentPhone }),
            },
        });

        res.status(200).json({ success: true, student: updatedStudent });
    } catch (error) {
        console.error("[PUT /api/update-student] Error:", error);
        res.status(500).json({ error: "Internal server error updating student" });
    }
}
