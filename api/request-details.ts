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

    const { studentId, message } = req.body;

    if (!studentId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const SMS_GATEWAY_KEY = process.env.SMS_GATEWAY_KEY;
        const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

        if (!SMS_GATEWAY_KEY || !TEXTBEE_DEVICE_ID) {
            return res.status(500).json({ error: "SMS Gateway is not fully configured" });
        }

        const TEXTBEE_API_URL = `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`;

        const response = await fetch(TEXTBEE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': SMS_GATEWAY_KEY,
            },
            body: JSON.stringify({
                recipients: [student.studentPhone],
                message: message,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            return res.status(502).json({ error: "Upstream SMS Provider Failed", details: result });
        }

        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("[POST /api/request-details] Error:", error);
        res.status(500).json({ error: "Internal server error sending request", details: String(error) });
    }
}
