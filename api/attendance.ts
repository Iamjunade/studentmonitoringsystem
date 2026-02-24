import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

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
        const sql = neon(process.env.DATABASE_URL!);

        const result = await sql`
      INSERT INTO "Attendance" (id, "studentId", status, date)
      VALUES (gen_random_uuid(), ${studentId}, ${status}, NOW())
      RETURNING *
    `;

        res.status(200).json({ success: true, record: result[0] });
    } catch (error) {
        console.error("[POST /api/attendance] Error:", error);
        res.status(500).json({ error: "Internal server error", details: String(error) });
    }
}
