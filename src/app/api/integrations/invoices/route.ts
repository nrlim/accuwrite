import { NextResponse } from 'next/server';
import { integrationQueue } from '@/lib/queue';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        let idempotencyKey = req.headers.get('idempotency-key');
        const payload = await req.json();

        // Fallback for TruXos / Trucking integration which might send manifestNumber instead of number
        if (payload.manifestNumber) {
            payload.number = payload.number || payload.manifestNumber;
            // Provide a default idempotency key from manifest number if header is missing
            idempotencyKey = idempotencyKey || payload.manifestNumber;
        }

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        // Verify it isn't completely invalid payload
        if (!payload.contactId || !payload.amount) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields (contactId, amount)' },
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
            status: 'success',
            message: 'Invoice accepted and queued',
            jobId: job.id,
        }, { status: 202 });

    } catch (error: unknown) {
        console.error('Error queuing invoice:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
