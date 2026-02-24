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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { studentId, status } = req.body;

    if (!studentId || !status) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const attendanceRecord = await prisma.attendance.create({
            data: {
                studentId,
                status, // 'present', 'absent', 'late'
            },
        });

        res.status(200).json({ success: true, record: attendanceRecord });
    } catch (error) {
        console.error("[POST /api/attendance] Error:", error);
        res.status(500).json({ error: "Internal server error saving attendance" });
    }
}
