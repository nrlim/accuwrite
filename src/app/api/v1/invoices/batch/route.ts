import { NextResponse } from 'next/server';
import { processBatchInvoicesJob } from '@/lib/invoiceProcessor';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const payload = await req.json();

        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        if (!Array.isArray(payload.items)) {
            return NextResponse.json(
                { error: 'Invalid payload: "items" must be an array' },
                { status: 400 }
            );
        }

        const itemsWithTenant = payload.items.map((item: any) => ({
            ...item,
            tenantId: auth.tenantId,
        }));

        // Internal batch processes synchronously
        const result = await processBatchInvoicesJob({ items: itemsWithTenant });

        return NextResponse.json({
            status: 'success',
            message: 'Batch invoices processed successfully',
            data: result,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error processing internal batch invoices:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
