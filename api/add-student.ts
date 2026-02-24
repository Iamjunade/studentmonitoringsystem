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

    const { name, rollNumber, email, parentName, parentPhone, studentPhone, grade, section } = req.body;

    if (!name || !rollNumber || !email || !parentName || !parentPhone || !studentPhone || !grade || !section) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const newStudent = await prisma.student.create({
            data: {
                name,
                rollNumber,
                email,
                parentName,
                parentPhone,
                studentPhone,
                grade,
                section,
                avatar: `https://i.pravatar.cc/150?u=${rollNumber}`,
                attendancePercentage: 0,
                gpa: 0,
            },
            include: {
                academicDetails: true,
            },
        });

        res.status(201).json({ success: true, student: newStudent });
    } catch (error: any) {
        console.error("[POST /api/add-student] Error:", error);
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: "A student with that roll number or email already exists." });
        }
        res.status(500).json({ error: "Internal server error creating student", details: String(error) });
    }
}
