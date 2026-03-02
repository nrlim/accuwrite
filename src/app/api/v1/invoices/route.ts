import { NextResponse } from 'next/server';
import { integrationQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const idempotencyKey = req.headers.get('idempotency-key');

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        const payload = await req.json();

        // Verify it isn't completely invalid payload
        if (!payload.tenantId || !payload.contactId || !payload.amount) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields' },
                { status: 400 }
            );
        }

        // Attach idempotencyKey to payload if the worker depends on it
        const jobData = { ...payload, idempotencyKey };

        // Enqueue job with the idempotency key as jobId to prevent duplicate enqueues
        const job = await integrationQueue.add('process-invoice', jobData, {
            jobId: idempotencyKey, // Prevents duplicate jobs in BullMQ
        });

        return NextResponse.json({
            message: 'Job accepted',
            jobId: job.id,
        }, { status: 202 });

    } catch (error: any) {
        console.error('Error queuing invoice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
