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

        if (!Array.isArray(payload.items)) {
            return NextResponse.json(
                { error: 'Invalid payload: "items" must be an array' },
                { status: 400 }
            );
        }

        // Attach tenantId to all items
        const itemsWithTenant = payload.items.map((item: Record<string, unknown>) => ({
            ...item,
            tenantId: auth.tenantId,
        }));

        const jobData = { items: itemsWithTenant };

        // Pass idempotencyKey as JobId so BullMQ rejects duplicates of the SAME batch
        const job = await integrationQueue.add('process-batch-invoices', jobData, {
            jobId: idempotencyKey,
        });

        return NextResponse.json({
            message: 'Batch accepted',
            jobId: job.id,
        }, { status: 202 });

    } catch (error: unknown) {
        console.error('Error queuing batch invoices:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
