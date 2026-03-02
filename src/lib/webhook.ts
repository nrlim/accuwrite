import crypto from 'crypto';

export function signWebhookPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function sendWebhookJob(data: { url: string; payload: any; secret: string; tenantId: string }) {
    const { url, payload, secret, tenantId } = data;
    const payloadStr = JSON.stringify(payload);
    const signature = signWebhookPayload(payloadStr, secret);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Accuwrite-Signature': `sha256=${signature}`,
            'X-Accuwrite-Tenant-ID': tenantId,
        },
        body: payloadStr,
        // Add timeout in real apps
    });

    if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status} - ${response.statusText}`);
    }

    return response.json().catch(() => ({}));
}
