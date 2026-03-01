'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize } from '@/lib/serialize';

// =================== ZOD SCHEMAS ===================

const BillItemSchema = z.object({
    description: z.string().min(1, 'Deskripsi item wajib diisi'),
    accountId: z.string().min(1, 'Pilih akun beban/aset per baris'),
    quantity: z.coerce.number().positive('Jumlah harus lebih dari 0'),
    unitPrice: z.coerce.number().positive('Harga harus lebih dari 0'),
    taxRate: z.coerce.number().min(0).max(100).default(0),
});

const CreateBillSchema = z.object({
    contactId: z.string().min(1, 'Pilih vendor'),
    date: z.string().min(1, 'Tanggal tagihan wajib diisi'),
    dueDate: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
    notes: z.string().optional().nullable(),
    // Account IDs for auto-posting
    apAccountId: z.string().min(1, 'Pilih akun Hutang Usaha (AP)'),
    items: z.array(BillItemSchema).min(1, 'Minimal 1 item'),
});

const RecordBillPaymentSchema = z.object({
    billId: z.string().min(1),
    date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
    amount: z.coerce.number().positive('Jumlah pembayaran harus lebih dari 0'),
    method: z.string().min(1, 'Pilih metode pembayaran'),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    cashAccountId: z.string().min(1, 'Pilih akun Kas/Bank'),
    apAccountId: z.string().min(1, 'Pilih akun Hutang Usaha'),
});

export type CreateBillData = z.infer<typeof CreateBillSchema>;
export type RecordBillPaymentData = z.infer<typeof RecordBillPaymentSchema>;
export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== HELPERS ===================

async function generateBillNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.bill.count({
        where: { tenantId, number: { startsWith: `BILL-${year}${month}` } },
    });
    return `BILL-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

async function generateJournalRef(tenantId: string, prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.journalEntry.count({
        where: { tenantId, reference: { startsWith: `${prefix}-${year}${month}` } },
    });
    return `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =================== READ ===================

export async function getBills(status?: string) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    // Auto-update OVERDUE
    await prisma.bill.updateMany({
        where: {
            tenantId: session.tenantId,
            status: 'UNPAID',
            dueDate: { lt: new Date() },
        },
        data: { status: 'OVERDUE' },
    });

    const bills = await prisma.bill.findMany({
        where: {
            tenantId: session.tenantId,
            ...(status && status !== 'ALL' ? { status: status as any } : {}),
        },
        include: {
            contact: true,
            items: { include: { account: { select: { id: true, code: true, name: true } } } },
            payments: true,
            journalEntry: { select: { id: true, reference: true, status: true } },
        },
        orderBy: { date: 'desc' },
    });

    return { success: true as const, data: deepSerialize(bills), message: '' };
}

export async function getAPDashboardSummary() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const now = new Date();
    const [totalAP, overdueAP, billCount, recentBills] = await Promise.all([
        prisma.bill.aggregate({
            where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
            _sum: { totalAmount: true, paidAmount: true },
        }),
        prisma.bill.aggregate({
            where: { tenantId: session.tenantId, status: 'OVERDUE', dueDate: { lt: now } },
            _sum: { totalAmount: true, paidAmount: true },
        }),
        prisma.bill.count({ where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } } }),
        prisma.bill.findMany({
            where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
            include: { contact: true },
            orderBy: { dueDate: 'asc' },
            take: 5,
        }),
    ]);

    const outstanding =
        Number(totalAP._sum.totalAmount || 0) - Number(totalAP._sum.paidAmount || 0);
    const overdueOutstanding =
        Number(overdueAP._sum.totalAmount || 0) - Number(overdueAP._sum.paidAmount || 0);

    return {
        success: true as const,
        data: deepSerialize({ outstanding, overdueOutstanding, billCount, recentBills }),
        message: '',
    };
}

export async function getAPAgingReport() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const now = new Date();
    const bills = await prisma.bill.findMany({
        where: {
            tenantId: session.tenantId,
            status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        },
        include: { contact: true },
        orderBy: { dueDate: 'asc' },
    });

    type BillWithExtra = typeof bills[0] & { daysOverdue: number; outstanding: number };

    const buckets = {
        current: [] as BillWithExtra[],
        '1-30': [] as BillWithExtra[],
        '31-60': [] as BillWithExtra[],
        '61-90': [] as BillWithExtra[],
        '91+': [] as BillWithExtra[],
    };

    bills.forEach((bill) => {
        const daysOverdue = Math.floor(
            (now.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const outstanding = Number(bill.totalAmount) - Number(bill.paidAmount);
        const item: BillWithExtra = { ...bill, daysOverdue, outstanding };

        if (daysOverdue <= 0) buckets.current.push(item);
        else if (daysOverdue <= 30) buckets['1-30'].push(item);
        else if (daysOverdue <= 60) buckets['31-60'].push(item);
        else if (daysOverdue <= 90) buckets['61-90'].push(item);
        else buckets['91+'].push(item);
    });

    const summary = {
        current: { count: buckets.current.length, total: buckets.current.reduce((s, i) => s + i.outstanding, 0) },
        '1-30': { count: buckets['1-30'].length, total: buckets['1-30'].reduce((s, i) => s + i.outstanding, 0) },
        '31-60': { count: buckets['31-60'].length, total: buckets['31-60'].reduce((s, i) => s + i.outstanding, 0) },
        '61-90': { count: buckets['61-90'].length, total: buckets['61-90'].reduce((s, i) => s + i.outstanding, 0) },
        '91+': { count: buckets['91+'].length, total: buckets['91+'].reduce((s, i) => s + i.outstanding, 0) },
    };

    return { success: true as const, data: deepSerialize({ buckets, summary, bills }), message: '' };
}

// =================== CREATE BILL ===================

export async function createBill(
    formData: CreateBillData
): Promise<ActionResult<{ id: string; number: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = CreateBillSchema.safeParse(formData);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { contactId, date, dueDate, notes, apAccountId, items } = parsed.data;

    // Validate contact
    const contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId: session.tenantId },
    });
    if (!contact) return { success: false, error: 'Vendor tidak valid' };

    // Validate AP account
    const apAcct = await prisma.account.findFirst({
        where: { id: apAccountId, tenantId: session.tenantId },
    });
    if (!apAcct) return { success: false, error: 'Akun Hutang tidak valid' };

    // Validate all item accounts
    const itemAccountIds = [...new Set(items.map((i) => i.accountId))];
    const itemAccounts = await prisma.account.findMany({
        where: { id: { in: itemAccountIds }, tenantId: session.tenantId },
    });
    if (itemAccounts.length !== itemAccountIds.length) {
        return { success: false, error: 'Satu atau lebih akun item tidak valid' };
    }

    // Calculate totals
    const billItems = items.map((item) => {
        const baseAmount = item.quantity * item.unitPrice;
        const taxAmount = baseAmount * (item.taxRate / 100);
        return { ...item, computedAmount: baseAmount + taxAmount, baseAmount, taxAmount };
    });

    const subtotal = billItems.reduce((s, i) => s + i.baseAmount, 0);
    const taxAmount = billItems.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    const [billNumber, journalRef] = await Promise.all([
        generateBillNumber(session.tenantId),
        generateJournalRef(session.tenantId, 'AP'),
    ]);

    try {
        /*
         * AUTO JOURNAL (AP):
         *  For each line item:
         *    Debit  → item.accountId  (Beban Gaji / Beban Listrik / Aset)
         *  Combined:
         *    Kredit → apAccountId    (Hutang Usaha)
         *
         *  If multiple expense accounts, create one debit line per item account.
         *  One combined credit line to AP.
         */
        const result = await prisma.$transaction(async (tx) => {
            // Build journal debit lines grouped by accountId
            const debitByAccount = new Map<string, number>();
            for (const item of billItems) {
                debitByAccount.set(
                    item.accountId,
                    (debitByAccount.get(item.accountId) || 0) + item.computedAmount
                );
            }

            const debitLines = [...debitByAccount.entries()].map(([accountId, amount]) => ({
                accountId,
                contactId,
                debit: amount,
                credit: 0,
                memo: `Tagihan ${billNumber} - ${contact.name}`,
            }));

            const creditLine = {
                accountId: apAccountId,
                contactId,
                debit: 0,
                credit: totalAmount,
                memo: `Hutang usaha - ${billNumber}`,
            };

            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: new Date(date),
                    reference: journalRef,
                    description: `Bill ${billNumber} - ${contact.name}`,
                    status: 'POSTED',
                    sourceType: 'BILL',
                    tenantId: session.tenantId,
                    items: { create: [...debitLines, creditLine] },
                },
            });

            const bill = await tx.bill.create({
                data: {
                    number: billNumber,
                    date: new Date(date),
                    dueDate: new Date(dueDate),
                    status: 'UNPAID',
                    subtotal,
                    taxAmount,
                    totalAmount,
                    paidAmount: 0,
                    notes,
                    contactId,
                    journalEntryId: journalEntry.id,
                    tenantId: session.tenantId,
                    items: {
                        create: billItems.map((item) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxRate: item.taxRate,
                            amount: item.computedAmount,
                            accountId: item.accountId,
                        })),
                    },
                },
            });

            await tx.journalEntry.update({
                where: { id: journalEntry.id },
                data: { sourceId: bill.id },
            });

            return bill;
        });

        revalidatePath('/dashboard/hutang');
        revalidatePath('/dashboard/jurnal');
        revalidatePath('/dashboard');
        return {
            success: true,
            data: { id: result.id, number: result.number },
            message: `Bill ${result.number} berhasil dibuat. Jurnal otomatis telah diposting.`,
        };
    } catch (err: any) {
        if (err?.code === 'P2002') {
            return { success: false, error: `Nomor bill "${billNumber}" sudah ada` };
        }
        console.error('[createBill]', err);
        return { success: false, error: 'Gagal membuat bill. Silakan coba lagi.' };
    }
}

// =================== RECORD BILL PAYMENT ===================

export async function recordBillPayment(
    formData: RecordBillPaymentData
): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = RecordBillPaymentSchema.safeParse(formData);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { billId, date, amount, method, reference, notes, cashAccountId, apAccountId } = parsed.data;

    const bill = await prisma.bill.findFirst({
        where: { id: billId, tenantId: session.tenantId },
        include: { contact: true },
    });
    if (!bill) return { success: false, error: 'Bill tidak ditemukan' };
    if (['PAID', 'VOID'].includes(bill.status)) {
        return { success: false, error: 'Bill sudah lunas atau dibatalkan' };
    }

    const remaining = Number(bill.totalAmount) - Number(bill.paidAmount);
    if (amount > remaining + 0.01) {
        return {
            success: false,
            error: `Jumlah pembayaran melebihi sisa hutang (Rp ${remaining.toLocaleString('id-ID')})`,
        };
    }

    const journalRef = await generateJournalRef(session.tenantId, 'BPMT');
    const newPaidAmount = Number(bill.paidAmount) + amount;
    const newStatus =
        Math.abs(newPaidAmount - Number(bill.totalAmount)) < 0.01 ? 'PAID' : 'PARTIAL';

    /*
     * PAYMENT JOURNAL (AP):
     *   Debit  → apAccountId    (Hutang Usaha berkurang — lunasi)
     *   Kredit → cashAccountId  (Kas/Bank berkurang)
     */
    const result = await prisma.$transaction(async (tx) => {
        const journalEntry = await tx.journalEntry.create({
            data: {
                date: new Date(date),
                reference: journalRef,
                description: `Pembayaran ${bill.number} - ${bill.contact.name}`,
                status: 'POSTED',
                sourceType: 'BILL_PAYMENT',
                sourceId: billId,
                tenantId: session.tenantId,
                items: {
                    create: [
                        {
                            accountId: apAccountId,
                            contactId: bill.contactId,
                            debit: amount,
                            credit: 0,
                            memo: `Bayar hutang ${bill.number}`,
                        },
                        {
                            accountId: cashAccountId,
                            contactId: bill.contactId,
                            debit: 0,
                            credit: amount,
                            memo: `Pembayaran bill ${bill.number}`,
                        },
                    ],
                },
            },
        });

        const payment = await tx.billPayment.create({
            data: {
                date: new Date(date),
                amount,
                method,
                reference,
                notes,
                billId,
                tenantId: session.tenantId,
            },
        });

        await tx.bill.update({
            where: { id: billId },
            data: { paidAmount: newPaidAmount, status: newStatus },
        });

        return payment;
    });

    revalidatePath('/dashboard/hutang');
    revalidatePath('/dashboard/jurnal');
    revalidatePath('/dashboard');
    return {
        success: true,
        data: { id: result.id },
        message:
            newStatus === 'PAID'
                ? `Bill ${bill.number} telah LUNAS DIBAYAR`
                : `Pembayaran Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`,
    };
}

// =================== VOID BILL ===================

export async function voidBill(id: string): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const bill = await prisma.bill.findFirst({
        where: { id, tenantId: session.tenantId },
    });
    if (!bill) return { success: false, error: 'Bill tidak ditemukan' };
    if (Number(bill.paidAmount) > 0) {
        return { success: false, error: 'Bill yang sudah ada pembayaran tidak bisa dibatalkan' };
    }

    await prisma.$transaction(async (tx) => {
        if (bill.journalEntryId) {
            await tx.journalEntry.update({
                where: { id: bill.journalEntryId },
                data: { status: 'VOID' },
            });
        }
        await tx.bill.update({
            where: { id },
            data: { status: 'VOID' },
        });
    });

    revalidatePath('/dashboard/hutang');
    revalidatePath('/dashboard/jurnal');
    revalidatePath('/dashboard');
    return { success: true, data: undefined, message: `Bill ${bill.number} berhasil dibatalkan` };
}

// =================== CONTACT ACTIONS (re-export friendly) ===================

export async function getContactsForAP() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const contacts = await prisma.contact.findMany({
        where: {
            tenantId: session.tenantId,
            OR: [{ type: 'VENDOR' }, { type: 'BOTH' }],
        },
        orderBy: { name: 'asc' },
    });
    return { success: true as const, data: deepSerialize(contacts), message: '' };
}

export async function getAllContacts() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const contacts = await prisma.contact.findMany({
        where: { tenantId: session.tenantId },
        include: {
            _count: { select: { invoices: true, bills: true } },
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return { success: true as const, data: contacts, message: '' };
}

export async function updateContact(
    id: string,
    data: { name: string; type: string; email?: string | null; phone?: string | null; address?: string | null; npwp?: string | null }
): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const contact = await prisma.contact.findFirst({
        where: { id, tenantId: session.tenantId },
    });
    if (!contact) return { success: false, error: 'Kontak tidak ditemukan' };

    const updated = await prisma.contact.update({
        where: { id },
        data: {
            name: data.name,
            type: data.type as any,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            npwp: data.npwp || null,
        },
    });

    revalidatePath('/dashboard/kontak');
    revalidatePath('/dashboard/piutang');
    revalidatePath('/dashboard/hutang');
    return { success: true, data: { id: updated.id }, message: `Kontak "${updated.name}" berhasil diperbarui` };
}

export async function deleteContact(id: string): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const contact = await prisma.contact.findFirst({
        where: { id, tenantId: session.tenantId },
        include: { _count: { select: { invoices: true, bills: true } } },
    });
    if (!contact) return { success: false, error: 'Kontak tidak ditemukan' };
    if (contact._count.invoices > 0 || contact._count.bills > 0) {
        return { success: false, error: 'Kontak memiliki transaksi aktif dan tidak bisa dihapus' };
    }

    await prisma.contact.delete({ where: { id } });
    revalidatePath('/dashboard/kontak');
    return { success: true, data: undefined, message: `Kontak berhasil dihapus` };
}
