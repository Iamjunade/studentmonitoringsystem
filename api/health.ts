import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    res.status(200).json({
        ok: true,
        env_check: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
    });
}
