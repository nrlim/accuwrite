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

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        const payload = await req.json();

        // Verify it isn't completely invalid payload
        if (!payload.contactId || !payload.amount) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields' },
                { status: 400 }
            );
        }

        // Attach idempotencyKey and tenantId to payload
        const jobData = { ...payload, idempotencyKey, tenantId: auth.tenantId };

        // Enqueue job with the idempotency key as jobId to prevent duplicate enqueues
        const job = await integrationQueue.add('process-invoice', jobData, {
            jobId: idempotencyKey, // Prevents duplicate jobs in BullMQ
        });

        return NextResponse.json({
            message: 'Job accepted',
            jobId: job.id,
        }, { status: 202 });

    } catch (error: unknown) {
        console.error('Error queuing invoice:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
