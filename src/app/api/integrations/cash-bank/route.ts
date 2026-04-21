import { NextResponse } from 'next/server';
import { processCashTxJob } from '@/lib/cashProcessor';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        let idempotencyKey = req.headers.get('idempotency-key');
        const payload = await req.json();

        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        // TruXos compatibility: fallback idempotency key from manifestNumber
        if (payload.manifestNumber) {
            idempotencyKey = idempotencyKey || payload.manifestNumber;
        }

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        if (!payload.cashAccountId || !payload.counterAccountId || !payload.amount || !payload.type) {
            return NextResponse.json(
                { error: 'Missing required fields: cashAccountId, counterAccountId, amount, type (IN|OUT)' },
                { status: 400 }
            );
        }

        // Process synchronously (Vercel serverless — no Redis/BullMQ)
        const jobData = { ...payload, idempotencyKey, tenantId: auth.tenantId };
        const result = await processCashTxJob(jobData);

        return NextResponse.json({
            status: 'success',
            message: 'Cash transaction processed successfully.',
            transactionId: result.id,
            idempotencyKey,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error processing cash transaction:', error);
        const msg = error instanceof Error ? error.message : String(error);
        const isConflict = typeof msg === 'string' && (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'));
        return NextResponse.json(
            { error: isConflict ? 'Duplicate record — transaction already exists.' : msg },
            { status: isConflict ? 409 : 500 }
        );
    }
}
