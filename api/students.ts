import type { VercelRequest, VercelResponse } from '@vercel/node';
import getPrismaClient from '../lib/prisma';

const prisma = getPrismaClient();

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const students = await prisma.student.findMany({
            include: {
                academicDetails: true,
            },
        });

        res.status(200).json(students);
    } catch (error) {
        console.error("[GET /api/students] Error:", error);
        res.status(500).json({ error: "Internal server error fetching students", details: String(error) });
    }
}
