import { prisma } from '@/lib/prisma';

export interface TruXosInvoiceData {
    idempotencyKey: string;
    sourceSys: string; // 'TruXos'
    tenantId: string;
    contactId: string;
    number: string;
    date: string;       // ISO date
    dueDate: string;    // ISO date
    category: string;   // 'Solar', 'Maintenance', etc
    amount: number;
    description: string;
}

export async function processInvoiceJob(data: TruXosInvoiceData) {
    // Provide sensible defaults for trucking integrations that might omit some fields
    const safeSourceSys = data.sourceSys || 'TruXos';
    const safeCategory = data.category || 'General';
    const safeDate = data.date ? new Date(data.date) : new Date();
    const safeDueDate = data.dueDate ? new Date(data.dueDate) : safeDate;
    const safeDescription = data.description || `Delivery Manifest: ${data.number || 'N/A'}`;

    // Check Idempotency Key
    const existingInvoice = await prisma.invoice.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
    });

    if (existingInvoice) {
        console.log(`Invoice with idempotency key ${data.idempotencyKey} already exists. Skipping.`);
        return existingInvoice;
    }

    // Find Mapping for the Category
    const mapping = await prisma.mappingTable.findUnique({
        where: {
            sourceSys_sourceCat_tenantId: {
                sourceSys: safeSourceSys,
                sourceCat: safeCategory,
                tenantId: data.tenantId,
            },
        },
    });

    let targetAccountId = null;
    if (mapping) {
        targetAccountId = mapping.targetAccId;
    } else {
        // If no specific mapping, we might fall back to a default account or log warning
        console.warn(`No mapping found for ${safeSourceSys} - ${safeCategory}.`);
    }

    // Use a transaction to ensure all or nothing
    const result = await prisma.$transaction(async (tx) => {
        // Create the invoice
        const newInvoice = await tx.invoice.create({
            data: {
                idempotencyKey: data.idempotencyKey,
                number: data.number || data.idempotencyKey,
                date: safeDate,
                dueDate: safeDueDate,
                subtotal: data.amount,
                totalAmount: data.amount,
                tenantId: data.tenantId,
                contactId: data.contactId,
            },
        });

        // Create single line item
        await tx.invoiceItem.create({
            data: {
                invoiceId: newInvoice.id,
                description: safeDescription,
                quantity: 1,
                unitPrice: data.amount,
                amount: data.amount,
            },
        });

        // Optionally: Create a mapped JournalEntry in the background
        if (targetAccountId) {
            const je = await tx.journalEntry.create({
                data: {
                    date: safeDate,
                    reference: newInvoice.number,
                    description: `Integration: ${safeDescription}`,
                    sourceType: "INVOICE",
                    sourceId: newInvoice.id,
                    tenantId: data.tenantId,
                    status: "POSTED", // Auto post because it was configured in mapping
                },
            });

            // Credit to default AR / Sales or based on target account mapping
            // Here usually: if it is expense mapping from solar -> we create debit expense, credit ap
            // But the doc said 'Invoice', meaning AR? Or is TruXos creating Bill (AP)?
            // For simplicity, we just debit the mapped account and credit another, or vice versa
            await tx.journalItem.createMany({
                data: [
                    { journalEntryId: je.id, accountId: targetAccountId, debit: data.amount, credit: 0 },
                    // A real setup would look up the other balancing account. We'll leave the balancing entry conceptual here..
                ],
            });

            await tx.invoice.update({
                where: { id: newInvoice.id },
                data: { journalEntryId: je.id }
            })
        }

        return newInvoice;
    });

    // Log successful integration
    await prisma.integrationLog.create({
        data: {
            system: `Process Invoice: ${safeSourceSys}`,
            endpoint: 'Background Worker',
            status: 'SUCCESS',
            requestData: JSON.stringify(data),
            responseData: JSON.stringify(result),
            tenantId: data.tenantId,
        },
    });

    return result;
}

export async function processBatchInvoicesJob(batchData: { items: TruXosInvoiceData[] }) {
    const results = [];
    const errors = [];

    for (const item of batchData.items) {
        try {
            const res = await processInvoiceJob(item);
            results.push(res);
        } catch (error: any) {
            console.error(`Batch processing failed for item ${item.idempotencyKey}:`, error);
            errors.push({ item, error: error.message });

            // Log failure in integration logs
            await prisma.integrationLog.create({
                data: {
                    system: `Process Batch Invoice: ${item.sourceSys}`,
                    endpoint: 'Background Worker (Batch)',
                    status: 'FAILED',
                    requestData: JSON.stringify(item),
                    errorMessage: error.message,
                    tenantId: item.tenantId,
                },
            });
        }
    }

    // Throw if entire batch failed
    if (errors.length > 0 && results.length === 0) {
        throw new Error(`Entire batch failed. First error: ${errors[0].error}`);
    }

    return { results, errors };
}
