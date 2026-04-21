import { NextResponse } from 'next/server';
import { processCashTxJob } from '@/lib/cashProcessor';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const payload = await req.json();

        if (!Array.isArray(payload)) {
            return NextResponse.json({ error: 'Payload must be an array of transactions' }, { status: 400 });
        }

        if (payload.length === 0) {
            return NextResponse.json({ error: 'Array is empty' }, { status: 400 });
        }
        
        if (payload.length > 100) {
            return NextResponse.json({ error: 'Maximum 100 transactions per batch request' }, { status: 400 });
        }

        const successful = [];
        const failed = [];

        for (let i = 0; i < payload.length; i++) {
            const item = payload[i];
            
            if (!item.cashAccountId || !item.counterAccountId || !item.amount || !item.type) {
                failed.push({ index: i, error: 'Missing required fields: cashAccountId, counterAccountId, amount, type (IN|OUT)' });
                continue;
            }

            const idempotencyKey = item.idempotencyKey || item.manifestNumber;
            if (!idempotencyKey) {
                failed.push({ index: i, error: 'Missing idempotencyKey or manifestNumber' });
                continue;
            }

            try {
                const jobData = { ...item, idempotencyKey, tenantId: auth.tenantId };
                const result = await processCashTxJob(jobData);
                successful.push({ index: i, status: 'success', transactionId: result.id, idempotencyKey });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                const isConflict = typeof msg === 'string' && (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'));
                failed.push({ index: i, error: isConflict ? 'Duplicate record — transaction already exists.' : msg, idempotencyKey });
            }
        }

        const status = failed.length === 0 ? 201 : (successful.length === 0 ? 400 : 207); // 207 Multi-Status

        return NextResponse.json({
            status: failed.length === 0 ? 'success' : 'partial_success',
            message: `Processed ${successful.length} successful, ${failed.length} failed.`,
            successful,
            failed,
        }, { status });

    } catch (error: unknown) {
        console.error('Error processing batch cash transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
