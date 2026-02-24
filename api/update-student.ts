import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

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
        const sql = neon(process.env.DATABASE_URL!);

        let result;
        if (name && parentPhone && studentPhone) {
            result = await sql`UPDATE "Student" SET name = ${name}, "parentPhone" = ${parentPhone}, "studentPhone" = ${studentPhone}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
        } else if (name) {
            result = await sql`UPDATE "Student" SET name = ${name}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
        } else if (parentPhone) {
            result = await sql`UPDATE "Student" SET "parentPhone" = ${parentPhone}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
        } else if (studentPhone) {
            result = await sql`UPDATE "Student" SET "studentPhone" = ${studentPhone}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
        }

        if (!result || result.length === 0) {
            return res.status(400).json({ error: "No fields to update or student not found" });
        }

        res.status(200).json({ success: true, student: result[0] });
    } catch (error) {
        console.error("[PUT /api/update-student] Error:", error);
        res.status(500).json({ error: "Internal server error", details: String(error) });
    }
}
