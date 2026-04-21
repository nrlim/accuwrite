import { prisma } from '@/lib/prisma';

export interface PaymentIntegrationData {
    sourceSys: string;
    tenantId: string;
    idempotencyKey: string;
    invoiceId: string;    // ID Invoice di Accuwrite
    cashAccountId: string; // ID Akun Kas/Bank tempat uang masuk
    amount: number;
    date: string;
    method: string;       // Transfer, Midtrans, etc
    reference?: string;   // Transaction ID dari payment gateway
}

export async function processPaymentJob(data: PaymentIntegrationData) {
    const safeDate = data.date ? new Date(data.date) : new Date();

    // 1. Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { contact: true }
    });

    if (!invoice) {
        throw new Error(`Invoice with ID ${data.invoiceId} not found.`);
    }

    // 2. Prevent duplicate payment recording
    const existingPayment = await prisma.payment.findFirst({
        where: {
            tenantId: data.tenantId,
            invoiceId: data.invoiceId,
            reference: data.reference,
            amount: data.amount
        }
    });

    if (existingPayment) {
        console.log(`Payment for invoice ${data.invoiceId} already exists. Skipping.`);
        return existingPayment;
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Payment Record
        const payment = await tx.payment.create({
            data: {
                date: safeDate,
                amount: data.amount,
                method: data.method,
                reference: data.reference,
                invoiceId: data.invoiceId,
                tenantId: data.tenantId,
            }
        });

        // 2. Update Invoice Paid Amount and Status
        const newPaidAmount = Number(invoice.paidAmount) + data.amount;
        let newStatus = 'PARTIAL';
        if (newPaidAmount >= Number(invoice.totalAmount)) {
            newStatus = 'PAID';
        }

        await tx.invoice.update({
            where: { id: invoice.id },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus as any
            }
        });

        // 3. Create Journal Entry (Debit Cash, Credit Accounts Receivable)
        const je = await tx.journalEntry.create({
            data: {
                date: safeDate,
                reference: data.reference || `PAY-${payment.id.slice(-6)}`,
                description: `Payment Integration: ${data.method} - Invoice ${invoice.number}`,
                sourceType: "PAYMENT",
                sourceId: payment.id,
                tenantId: data.tenantId,
                status: "POSTED",
            }
        });

        // AR Account (Piutang) is usually associated with the invoice or a default AR account
        // For simplicity, we find the account with type ASSET and 'Piutang' in name
        const arAccount = await tx.account.findFirst({
            where: {
                tenantId: data.tenantId,
                type: 'ASSET',
                name: { contains: 'Piutang', mode: 'insensitive' }
            }
        });

        if (!arAccount) throw new Error("Piutang (AR) account not found for this tenant.");

        await tx.journalItem.createMany({
            data: [
                { journalEntryId: je.id, accountId: data.cashAccountId, debit: data.amount, credit: 0, memo: `Payment for INV ${invoice.number}` },
                { journalEntryId: je.id, accountId: arAccount.id, debit: 0, credit: data.amount, contactId: invoice.contactId, memo: `Payment for INV ${invoice.number}` }
            ]
        });

        return payment;
    });

    return result;
}
