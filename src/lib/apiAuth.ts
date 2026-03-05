import { prisma } from '@/lib/prisma';

export async function verifyApiAuth(req: Request) {
    const apiKey = req.headers.get('x-accuwrite-api-key') || req.headers.get('x-api-key');
    const apiSecret = req.headers.get('x-accuwrite-api-secret') || req.headers.get('x-api-secret');

    if (!apiKey) {
        return { error: 'Missing API Key in headers', status: 401 };
    }

    // Build query. If secret is provided, check it. Otherwise just check key.
    // Since some docs say just send key, we might need to allow just key if secret isn't mandatory for the endpoint.
    // But secret is more secure. Let's make it so if they only provide key, it fails IF we want strictly secure. 
    // Wait, the API Key model stores `secret` and `key`, and both are plain text (or meant to be hashed, but right now they are plain text generated in the action).

    const validKey = await prisma.apiKey.findFirst({
        where: {
            key: apiKey,
            // If secret is passed in header, verify it. 
            // In a strict mode, we should mandate it, but the existing docs for Contacts only had X-Accuwrite-Api-Key.
            // Let's check both if secret is provided.
            ...(apiSecret ? { secret: apiSecret } : {}),
            isActive: true,
        },
    });

    if (!validKey) {
        return { error: 'Invalid API credentials', status: 401 };
    }

    return { tenantId: validKey.tenantId, validKey, error: null };
}
