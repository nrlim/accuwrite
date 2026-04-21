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

        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        if (!idempotencyKey) {
            idempotencyKey = payload.idempotencyKey || (Array.isArray(payload.items) && payload.items[0]?.manifestNumber);
        }

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        if (!Array.isArray(payload.items)) {
            return NextResponse.json(
                { error: 'Invalid payload: "items" must be an array' },
                { status: 400 }
            );
        }

        // Map manifestNumber to number for compatibility
        payload.items.forEach((item: any) => {
            if (item.manifestNumber) {
                item.number = item.number || item.manifestNumber;
                item.idempotencyKey = item.idempotencyKey || item.manifestNumber;
            }
        });

        const itemsWithTenant = payload.items.map((item: Record<string, unknown>) => ({
            ...item,
            tenantId: auth.tenantId,
        }));

        const jobData = { items: itemsWithTenant };

        const job = await integrationQueue.add('process-batch-invoices', jobData, {
            jobId: idempotencyKey,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Batch accepted and queued',
            jobId: job.id,
        }, { status: 202 });

    } catch (error: unknown) {
        console.error('Error queuing batch invoices:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
