import { NextResponse } from 'next/server';
import { processExpenseJob } from '@/lib/expenseProcessor';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const payload = await req.json();

        if (!Array.isArray(payload)) {
            return NextResponse.json({ error: 'Payload must be an array of expenses' }, { status: 400 });
        }

        if (payload.length === 0) {
            return NextResponse.json({ error: 'Array is empty' }, { status: 400 });
        }
        
        if (payload.length > 50) {
            return NextResponse.json({ error: 'Maximum 50 expenses per bulk request' }, { status: 400 });
        }

        const successful = [];
        const failed = [];

        for (let i = 0; i < payload.length; i++) {
            const item = payload[i];
            
            // Basic validation per item
            if (!item.vendorId || !item.amount || !item.category || !(item.number || item.manifestNumber)) {
                failed.push({ index: i, error: 'Missing required fields (vendorId, amount, category, number)' });
                continue;
            }

            const number = item.number || item.manifestNumber;
            const idempotencyKey = item.idempotencyKey || number;

            try {
                const jobData = { ...item, number, idempotencyKey, tenantId: auth.tenantId };
                const result = await processExpenseJob(jobData);
                successful.push({ index: i, status: 'success', billId: result.id, number, idempotencyKey });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                const isConflict = typeof msg === 'string' && (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'));
                failed.push({ index: i, error: isConflict ? 'Duplicate record — bill already exists.' : msg, number });
            }
        }

        // Return mixed response
        const status = failed.length === 0 ? 201 : (successful.length === 0 ? 400 : 207); // 207 Multi-Status

        return NextResponse.json({
            status: failed.length === 0 ? 'success' : 'partial_success',
            message: `Processed ${successful.length} successful, ${failed.length} failed.`,
            successful,
            failed,
        }, { status });

    } catch (error: unknown) {
        console.error('Error processing bulk expenses:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
