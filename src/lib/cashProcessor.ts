import { prisma } from '@/lib/prisma';
import { CashTxType } from '@prisma/client';

export interface CashTxIntegrationData {
    sourceSys: string;
    tenantId: string;
    idempotencyKey: string;
    cashAccountId: string;    // ID Akun Kas/Bank di Accuwrite
    counterAccountId: string; // ID Akun Lawan (Pendapatan/Beban/Transfer)
    type: 'IN' | 'OUT';
    amount: number;
    date: string;
    reference?: string;
    description: string;
    contactId?: string;       // Optional contact
}

export async function processCashTxJob(data: CashTxIntegrationData) {
    const safeDate = data.date ? new Date(data.date) : new Date();
    
    // Check if reference + tenantId already exists to avoid duplicates
    // Since we don't have idempotencyKey in CashTransaction model, we use reference or amount+date+acc logic
    const existing = await prisma.cashTransaction.findFirst({
        where: {
            tenantId: data.tenantId,
            reference: data.reference,
            amount: data.amount,
            date: safeDate,
            cashAccountId: data.cashAccountId
        }
    });

    if (existing) {
        console.log(`Cash transaction already exists. Skipping.`);
        return existing;
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Cash Transaction
        const txRecord = await tx.cashTransaction.create({
            data: {
                date: safeDate,
                type: data.type as CashTxType,
                amount: data.amount,
                description: data.description,
                reference: data.reference,
                cashAccountId: data.cashAccountId,
                counterAccountId: data.counterAccountId,
                contactId: data.contactId,
                tenantId: data.tenantId,
            }
        });

        // 2. Create Journal Entry
        const je = await tx.journalEntry.create({
            data: {
                date: safeDate,
                reference: data.reference || `CASH-${txRecord.id.slice(-6)}`,
                description: `Cash Integration: ${data.description}`,
                sourceType: "CASH",
                sourceId: txRecord.id,
                tenantId: data.tenantId,
                status: "POSTED",
            }
        });

        // 3. Create Journal Items (Debit/Credit logic based on type)
        if (data.type === 'IN') {
            // Money In: Debit Cash, Credit Counter (Revenue/etc)
            await tx.journalItem.createMany({
                data: [
                    { journalEntryId: je.id, accountId: data.cashAccountId, debit: data.amount, credit: 0, memo: data.description },
                    { journalEntryId: je.id, accountId: data.counterAccountId, debit: 0, credit: data.amount, memo: data.description }
                ]
            });
        } else {
            // Money Out: Debit Counter (Expense/etc), Credit Cash
            await tx.journalItem.createMany({
                data: [
                    { journalEntryId: je.id, accountId: data.counterAccountId, debit: data.amount, credit: 0, memo: data.description },
                    { journalEntryId: je.id, accountId: data.cashAccountId, debit: 0, credit: data.amount, memo: data.description }
                ]
            });
        }

        // Link JE to CashTx
        await tx.cashTransaction.update({
            where: { id: txRecord.id },
            data: { journalEntryId: je.id }
        });

        return txRecord;
    });

    await prisma.integrationLog.create({
        data: {
            system: `Cash Integration: ${data.sourceSys}`,
            endpoint: '/api/integrations/cash-bank',
            status: 'SUCCESS',
            requestData: JSON.stringify(data),
            responseData: JSON.stringify(result),
            tenantId: data.tenantId,
        }
    });

    return result;
}
