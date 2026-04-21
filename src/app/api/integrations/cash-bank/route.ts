import { NextResponse } from 'next/server';
import { integrationQueue } from '@/lib/queue';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const idempotencyKey = req.headers.get('idempotency-key');
        const payload = await req.json();

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        // Validation for Cash Transaction
        if (!payload.cashAccountId || !payload.counterAccountId || !payload.amount || !payload.type) {
            return NextResponse.json(
                { error: 'Missing required fields: cashAccountId, counterAccountId, amount, type (IN|OUT)' },
                { status: 400 }
            );
        }

        const jobData = { ...payload, idempotencyKey, tenantId: auth.tenantId };

        const job = await integrationQueue.add('process-cash-tx', jobData, {
            jobId: idempotencyKey,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Cash transaction queued.',
            jobId: job.id
        }, { status: 202 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
