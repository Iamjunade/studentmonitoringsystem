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
