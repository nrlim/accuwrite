import { NextResponse } from 'next/server';
import { processInvoiceJob } from '@/lib/invoiceProcessor';
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

        // TruXos compatibility: fallback number and idempotency key from manifestNumber
        if (payload.manifestNumber) {
            payload.number = payload.number || payload.manifestNumber;
            idempotencyKey = idempotencyKey || payload.manifestNumber;
        }

        if (!idempotencyKey) {
            return NextResponse.json(
                { error: 'Missing Idempotency-Key header' },
                { status: 400 }
            );
        }

        if (!payload.contactId || !payload.amount) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields (contactId, amount)' },
                { status: 400 }
            );
        }

        // Process synchronously (Vercel serverless — no Redis/BullMQ)
        const jobData = { ...payload, idempotencyKey, tenantId: auth.tenantId };
        const result = await processInvoiceJob(jobData);

        return NextResponse.json({
            status: 'success',
            message: 'Invoice processed successfully.',
            invoiceId: result.id,
            idempotencyKey,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error processing invoice:', error);
        const msg = error instanceof Error ? error.message : String(error);
        const isConflict = typeof msg === 'string' && (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'));
        return NextResponse.json(
            { error: isConflict ? 'Duplicate record — invoice already exists.' : msg },
            { status: isConflict ? 409 : 500 }
        );
    }
}
