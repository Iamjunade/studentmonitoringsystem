import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSQL } from '../lib/prisma';

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
        const sql = getSQL();

        // Build dynamic SET clause
        const updates: string[] = [];
        const values: any[] = [];

        if (name) { updates.push(`name = $${updates.length + 2}`); values.push(name); }
        if (parentPhone) { updates.push(`"parentPhone" = $${updates.length + 2}`); values.push(parentPhone); }
        if (studentPhone) { updates.push(`"studentPhone" = $${updates.length + 2}`); values.push(studentPhone); }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        // Use a simpler approach with tagged template
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

        res.status(200).json({ success: true, student: result?.[0] });
    } catch (error) {
        console.error("[PUT /api/update-student] Error:", error);
        res.status(500).json({ error: "Internal server error", details: String(error) });
    }
}
