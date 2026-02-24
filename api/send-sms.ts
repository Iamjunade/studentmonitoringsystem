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
    const SMS_GATEWAY_KEY = process.env.SMS_GATEWAY_KEY || "uk_gHRx8BKeVjiEYRA1EUh3_bQXZbre-5De8F1XBu1pzsbVxmWX9xh7MFzUUymBIDVM";
    const ANDROID_SMS_GATEWAY_URL = "https://api.sms-gateway.app/v1/message/send";

    const url = new URL(ANDROID_SMS_GATEWAY_URL);
    url.searchParams.append("key", SMS_GATEWAY_KEY);
    url.searchParams.append("phone", phone);
    url.searchParams.append("message", message);

    console.log(`[VERCEL SMS] Sending to ${phone}...`);

    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      console.error("[VERCEL SMS ERROR]", errorText);
      res.status(500).json({ error: "Failed to send SMS via gateway", details: errorText });
    }
  } catch (error) {
    console.error("[VERCEL SMS EXCEPTION]", error);
    res.status(500).json({ error: "Internal server error during SMS dispatch" });
  }
}
