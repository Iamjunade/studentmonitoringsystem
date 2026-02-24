import type { VercelRequest, VercelResponse } from '@vercel/node';
import getPrismaClient from '../lib/prisma';

const prisma = getPrismaClient();

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
                status,
            },
        });

        res.status(200).json({ success: true, record: attendanceRecord });
    } catch (error) {
        console.error("[POST /api/attendance] Error:", error);
        res.status(500).json({ error: "Internal server error saving attendance", details: String(error) });
    }
}
