import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Security Middleware
  app.use(helmet({ contentSecurityPolicy: false })); // CSP false to avoid breaking Vite in dev

  // CORS configuration
  app.use(cors());

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  });
  app.use("/api/", globalLimiter);

  // Stricter Rate Limiting for SMS
  const smsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many SMS requests from this IP, please try again after an hour" },
  });

  app.use(express.json());

  // Authentication middleware
  const authenticateJWT = (req: any, res: any, next: any) => {
    const token = req.header("Authorization");
    if (token) {
      jwt.verify(token, "your-secret-key", (err: any, user: any) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

  // Initialize Prisma Client for local Express server
  const { PrismaClient } = await import("@prisma/client");
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");

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

  // API Route to add a new student
  app.post("/api/add-student", async (req, res) => {
    const { name, rollNumber, email, parentName, parentPhone, studentPhone, grade, section } = req.body;
    if (!name || !rollNumber || !email || !parentName || !parentPhone || !studentPhone || !grade || !section) {
      return res.status(400).json({ error: "All fields are required" });
    }
    try {
      const newStudent = await prisma.student.create({
        data: {
          name, rollNumber, email, parentName, parentPhone, studentPhone, grade, section,
          avatar: `https://i.pravatar.cc/150?u=${rollNumber}`,
          attendancePercentage: 0,
          gpa: 0,
        },
        include: { academicDetails: true },
      });
      res.status(201).json({ success: true, student: newStudent });
    } catch (error: any) {
      console.error("[POST /api/add-student] Error:", error);
      if (error?.code === "P2002") {
        return res.status(409).json({ error: "A student with that roll number or email already exists." });
      }
      res.status(500).json({ error: "Internal server error creating student" });
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
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": SMS_GATEWAY_KEY },
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

  // API Route for sending SMS
  app.post("/api/send-sms", smsLimiter, async (req, res) => {
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SMS_GATEWAY_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      });

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

  // Input validation example
  app.post("/api/data",
    body("name").isString().notEmpty(),
    body("email").isEmail(),
    (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      res.sendStatus(200);
    }
  );

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

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error Handler] ${req.method} ${req.url} Error:`, err);
    res.status(500).json({ error: "An unexpected error occurred." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
