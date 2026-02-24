import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: "Phone and message are required" });
  }

  try {
    const SMS_GATEWAY_KEY = process.env.SMS_GATEWAY_KEY;
    const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

    if (!SMS_GATEWAY_KEY || !TEXTBEE_DEVICE_ID) {
      console.warn("[VERCEL SMS] Missing SMS_GATEWAY_KEY or TEXTBEE_DEVICE_ID environment variables.");
      return res.status(500).json({ error: "SMS Gateway is not fully configured" });
    }

    const TEXTBEE_API_URL = `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`;

    console.log(`[VERCEL SMS] Sending to ${phone} via TextBee...`);

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

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      console.error("[VERCEL SMS ERROR]", errorText);
      res.status(500).json({ error: "Failed to send SMS via TextBee", details: errorText });
    }
  } catch (error) {
    console.error("[VERCEL SMS EXCEPTION]", error);
    res.status(500).json({ error: "Internal server error during SMS dispatch" });
  }
}
