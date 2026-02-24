import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const students = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object('id', ad.id, 'subject', ad.subject, 'grade', ad.grade, 'score', ad.score)
          ) FILTER (WHERE ad.id IS NOT NULL),
          '[]'
        ) as "academicDetails"
      FROM "Student" s
      LEFT JOIN "AcademicDetail" ad ON ad."studentId" = s.id
      GROUP BY s.id
      ORDER BY s."createdAt" DESC
    `;

    res.status(200).json(students);
  } catch (error) {
    console.error("[GET /api/students] Error:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
}
