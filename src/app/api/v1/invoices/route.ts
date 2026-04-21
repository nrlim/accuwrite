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

        // Standard validation
        if (!payload.contactId || !payload.amount) {
            return NextResponse.json(
                { error: 'Invalid payload: missing required fields (contactId, amount)' },
                { status: 400 }
            );
        }

        // Internal API usually processes synchronously
        const result = await processInvoiceJob({
            ...payload,
            idempotencyKey: idempotencyKey || `INT-${Date.now()}`,
            tenantId: auth.tenantId,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Invoice processed successfully',
            data: result,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error processing internal invoice:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
