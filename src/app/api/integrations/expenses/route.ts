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

        // Basic validation
        if (!payload.vendorId || !payload.amount || !payload.category || !payload.number) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields (vendorId, amount, category, number)' },
                { status: 400 }
            );
        }

        // Attach idempotencyKey and tenantId to payload
        const jobData = { ...payload, idempotencyKey, tenantId: auth.tenantId };

        // Enqueue job
        const job = await integrationQueue.add('process-expense', jobData, {
            jobId: idempotencyKey, // Prevents duplicate jobs in BullMQ
        });

        return NextResponse.json({
            status: 'success',
            message: 'Expense record accepted and queued.',
            jobId: job.id,
            idempotencyKey
        }, { status: 202 });

    } catch (error: any) {
        console.error('Error queuing expense:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
