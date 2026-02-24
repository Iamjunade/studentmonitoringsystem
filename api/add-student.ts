import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, rollNumber, email, parentName, parentPhone, studentPhone, grade, section } = req.body;

    if (!name || !rollNumber || !email || !parentName || !parentPhone || !studentPhone || !grade || !section) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const sql = neon(process.env.DATABASE_URL!);
        const avatar = `https://i.pravatar.cc/150?u=${rollNumber}`;

        const result = await sql`
      INSERT INTO "Student" (id, name, "rollNumber", email, "parentName", "parentPhone", "studentPhone", grade, section, avatar, "attendancePercentage", gpa, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${rollNumber}, ${email}, ${parentName}, ${parentPhone}, ${studentPhone}, ${grade}, ${section}, ${avatar}, 0, 0, NOW(), NOW())
      RETURNING *
    `;

        const student = { ...result[0], academicDetails: [], attendanceHistory: [] };
        res.status(201).json({ success: true, student });
    } catch (error: any) {
        console.error("[POST /api/add-student] Error:", error);
        if (error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
            return res.status(409).json({ error: "A student with that roll number or email already exists." });
        }
        res.status(500).json({ error: "Internal server error", details: String(error) });
    }
}
