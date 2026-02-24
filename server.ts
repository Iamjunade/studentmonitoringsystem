import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Prisma Client for local Express server
  const { PrismaClient } = await import('@prisma/client');
  const { Pool } = await import('pg');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // API Route to fetch all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await prisma.student.findMany({
        include: { academicDetails: true },
      });
      res.status(200).json(students);
    } catch (error) {
      console.error("[GET /api/students] Error:", error);
      res.status(500).json({ error: "Internal server error fetching students" });
    }
  });

  // API Route to register attendance
  app.post("/api/attendance", async (req, res) => {
    const { studentId, status } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const attendanceRecord = await prisma.attendance.create({
        data: { studentId, status },
      });
      res.status(200).json({ success: true, record: attendanceRecord });
    } catch (error) {
      console.error("[POST /api/attendance] Error:", error);
      res.status(500).json({ error: "Internal server error saving attendance" });
    }
  });

  // API Route to update student details (Mentor Access)
  app.put("/api/update-student", async (req, res) => {
    const { id, name, parentPhone, studentPhone } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing required student ID" });
    }
    try {
      const updatedStudent = await prisma.student.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(parentPhone && { parentPhone }),
          ...(studentPhone && { studentPhone }),
        },
      });
      res.status(200).json({ success: true, student: updatedStudent });
    } catch (error) {
      console.error("[PUT /api/update-student] Error:", error);
      res.status(500).json({ error: "Internal server error updating student" });
    }
  });

  // API Route to send SMS requesting academic details (Mentor Access)
  app.post("/api/request-details", async (req, res) => {
    const { studentId, message } = req.body;
    if (!studentId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': SMS_GATEWAY_KEY },
        body: JSON.stringify({ recipients: [student.studentPhone], message }),
      });

      if (response.ok) {
        res.status(200).json({ success: true });
      } else {
        const errorText = await response.text();
        res.status(502).json({ error: "Upstream SMS Provider Failed", details: errorText });
      }
    } catch (error) {
      console.error("[POST /api/request-details] Error:", error);
      res.status(500).json({ error: "Internal server error sending request" });
    }
  });

  // SMS Gateway Configuration
  const SMS_GATEWAY_KEY = process.env.SMS_GATEWAY_KEY || "uk_gHRx8BKeVjiEYRA1EUh3_bQXZbre-5De8F1XBu1pzsbVxmWX9xh7MFzUUymBIDVM";
  const ANDROID_SMS_GATEWAY_URL = "https://api.sms-gateway.app/v1/message/send";

  // API Route for sending SMS
  app.post("/api/send-sms", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }

    try {
      const SMS_GATEWAY_KEY = process.env.SMS_GATEWAY_KEY;
      const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

      if (!SMS_GATEWAY_KEY || !TEXTBEE_DEVICE_ID) {
        console.warn("[SERVER SMS] Missing SMS_GATEWAY_KEY or TEXTBEE_DEVICE_ID environment variables.");
        return res.status(500).json({ error: "SMS Gateway is not fully configured" });
      }

      const TEXTBEE_API_URL = `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`;

      console.log(`[SERVER SMS] Sending to ${phone} via TextBee...`);

      const response = await fetch(TEXTBEE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SMS_GATEWAY_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      });

      // Since we are on the server, we can check the response status
      if (response.ok) {
        res.json({ success: true });
      } else {
        const errorText = await response.text();
        console.error("[SERVER SMS ERROR]", errorText);
        res.status(500).json({ error: "Failed to send SMS via TextBee", details: errorText });
      }
    } catch (error) {
      console.error("[SERVER SMS EXCEPTION]", error);
      res.status(500).json({ error: "Internal server error during SMS dispatch" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
