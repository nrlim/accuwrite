'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize } from '@/lib/serialize';

// =================== ZOD SCHEMAS ===================

const InvoiceItemSchema = z.object({
    description: z.string().min(1, 'Deskripsi item wajib diisi'),
    quantity: z.coerce.number().positive('Jumlah harus lebih dari 0'),
    unitPrice: z.coerce.number().positive('Harga harus lebih dari 0'),
    taxRate: z.coerce.number().min(0).max(100).default(0),
});

const CreateInvoiceSchema = z.object({
    contactId: z.string().min(1, 'Pilih customer'),
    date: z.string().min(1, 'Tanggal invoice wajib diisi'),
    dueDate: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
    notes: z.string().optional().nullable(),
    // Account IDs for auto-posting
    arAccountId: z.string().min(1, 'Pilih akun Piutang'),
    revenueAccountId: z.string().min(1, 'Pilih akun Pendapatan'),
    items: z.array(InvoiceItemSchema).min(1, 'Minimal 1 item'),
});

const RecordPaymentSchema = z.object({
    invoiceId: z.string().min(1),
    date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
    amount: z.coerce.number().positive('Jumlah pembayaran harus lebih dari 0'),
    method: z.string().min(1, 'Pilih metode pembayaran'),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    cashAccountId: z.string().min(1, 'Pilih akun Kas/Bank'),
    arAccountId: z.string().min(1, 'Pilih akun Piutang'),
});

const ContactSchema = z.object({
    name: z.string().min(1, 'Nama kontak wajib diisi'),
    type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']).default('CUSTOMER'),
    email: z.string().email('Email tidak valid').optional().or(z.literal('')),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    npwp: z.string().optional().nullable(),
});

export type CreateInvoiceData = z.infer<typeof CreateInvoiceSchema>;
export type RecordPaymentData = z.infer<typeof RecordPaymentSchema>;
export type ContactFormData = z.infer<typeof ContactSchema>;
export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== HELPERS ===================

async function generateInvoiceNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.invoice.count({
        where: { tenantId, number: { startsWith: `INV-${year}${month}` } },
    });
    return `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

async function generateJournalRef(tenantId: string, prefix: string) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.journalEntry.count({
        where: { tenantId, reference: { startsWith: `${prefix}-${year}${month}` } },
    });
    return `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =================== CONTACT ACTIONS ===================

export async function getContacts(type?: 'CUSTOMER' | 'VENDOR' | 'BOTH') {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const contacts = await prisma.contact.findMany({
        where: {
            tenantId: session.tenantId,
            ...(type ? { OR: [{ type }, { type: 'BOTH' }] } : {}),
        },
        orderBy: { name: 'asc' },
    });

    return { success: true as const, data: deepSerialize(contacts), message: '' };
}

export async function createContact(formData: ContactFormData): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = ContactSchema.safeParse(formData);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const contact = await prisma.contact.create({
        data: { ...parsed.data, email: parsed.data.email || null, tenantId: session.tenantId },
    });

    revalidatePath('/dashboard/piutang');
    revalidatePath('/dashboard');
    return { success: true, data: { id: contact.id }, message: `Kontak "${contact.name}" berhasil dibuat` };
}

// =================== INVOICE ACTIONS ===================

export async function getInvoices(status?: string) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    // Auto-update overdue status
    const now = new Date();
    await prisma.invoice.updateMany({
        where: {
            tenantId: session.tenantId,
            status: 'UNPAID',
            dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
    });

    const invoices = await prisma.invoice.findMany({
        where: {
            tenantId: session.tenantId,
            ...(status && status !== 'ALL' ? { status: status as any } : {}),
        },
        include: {
            contact: true,
            items: true,
            payments: true,
        },
        orderBy: { date: 'desc' },
    });

    return { success: true as const, data: deepSerialize(invoices), message: '' };
}

export async function createInvoice(formData: CreateInvoiceData): Promise<ActionResult<{ id: string; number: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = CreateInvoiceSchema.safeParse(formData);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { contactId, date, dueDate, notes, arAccountId, revenueAccountId, items } = parsed.data;

    // Validate contact belongs to tenant
    const contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId: session.tenantId },
    });
    if (!contact) return { success: false, error: 'Customer tidak valid' };

    // Validate accounts
    const [arAcct, revAcct] = await Promise.all([
        prisma.account.findFirst({ where: { id: arAccountId, tenantId: session.tenantId } }),
        prisma.account.findFirst({ where: { id: revenueAccountId, tenantId: session.tenantId } }),
    ]);
    if (!arAcct) return { success: false, error: 'Akun Piutang tidak valid' };
    if (!revAcct) return { success: false, error: 'Akun Pendapatan tidak valid' };

    // Calculate totals
    const invoiceItems = items.map((item) => {
        const amount = item.quantity * item.unitPrice;
        const taxAmount = amount * (item.taxRate / 100);
        return { ...item, amount: amount + taxAmount };
    });
    const subtotal = invoiceItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = invoiceItems.reduce((s, i) => s + (i.quantity * i.unitPrice * i.taxRate) / 100, 0);
    const totalAmount = subtotal + taxAmount;

    const [invoiceNumber, journalRef] = await Promise.all([
        generateInvoiceNumber(session.tenantId),
        generateJournalRef(session.tenantId, 'AR'),
    ]);

    // Create invoice + journal in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create auto-journal: Debit Piutang, Credit Pendapatan
        const journalEntry = await tx.journalEntry.create({
            data: {
                date: new Date(date),
                reference: journalRef,
                description: `Invoice ${invoiceNumber} - ${contact.name}`,
                status: 'POSTED',
                sourceType: 'INVOICE',
                tenantId: session.tenantId,
                items: {
                    create: [
                        {
                            accountId: arAccountId,
                            contactId,
                            debit: totalAmount,
                            credit: 0,
                            memo: `Piutang - ${contact.name}`,
                        },
                        {
                            accountId: revenueAccountId,
                            debit: 0,
                            credit: totalAmount,
                            memo: `Pendapatan - Invoice ${invoiceNumber}`,
                        },
                    ],
                },
            },
        });

        const invoice = await tx.invoice.create({
            data: {
                number: invoiceNumber,
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
                    create: invoiceItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        amount: item.amount,
                    })),
                },
            },
        });

        // Update journal sourceId
        await tx.journalEntry.update({
            where: { id: journalEntry.id },
            data: { sourceId: invoice.id },
        });

        return invoice;
    });

    revalidatePath('/dashboard/piutang');
    revalidatePath('/dashboard/jurnal');
    revalidatePath('/dashboard');
    return {
        success: true,
        data: { id: result.id, number: result.number },
        message: `Invoice ${result.number} berhasil dibuat dan jurnal otomatis telah diposting`,
    };
}

export async function recordPayment(formData: RecordPaymentData): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = RecordPaymentSchema.safeParse(formData);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { invoiceId, date, amount, method, reference, notes, cashAccountId, arAccountId } = parsed.data;

    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId: session.tenantId },
        include: { contact: true },
    });
    if (!invoice) return { success: false, error: 'Invoice tidak ditemukan' };
    if (['PAID', 'VOID'].includes(invoice.status)) {
        return { success: false, error: 'Invoice sudah lunas atau dibatalkan' };
    }

    const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (amount > remaining + 0.01) {
        return { success: false, error: `Jumlah pembayaran melebihi sisa piutang (Rp ${remaining.toLocaleString('id-ID')})` };
    }

    const journalRef = await generateJournalRef(session.tenantId, 'PMT');
    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const newStatus =
        Math.abs(newPaidAmount - Number(invoice.totalAmount)) < 0.01
            ? 'PAID'
            : 'PARTIAL';

    const result = await prisma.$transaction(async (tx) => {
        // Journal: Debit Kas, Credit Piutang
        const journalEntry = await tx.journalEntry.create({
            data: {
                date: new Date(date),
                reference: journalRef,
                description: `Pelunasan ${invoice.number} - ${invoice.contact.name}`,
                status: 'POSTED',
                sourceType: 'PAYMENT',
                sourceId: invoiceId,
                tenantId: session.tenantId,
                items: {
                    create: [
                        {
                            accountId: cashAccountId,
                            contactId: invoice.contactId,
                            debit: amount,
                            credit: 0,
                            memo: `Penerimaan pembayaran ${invoice.number}`,
                        },
                        {
                            accountId: arAccountId,
                            contactId: invoice.contactId,
                            debit: 0,
                            credit: amount,
                            memo: `Pelunasan piutang ${invoice.number}`,
                        },
                    ],
                },
            },
        });

        const payment = await tx.payment.create({
            data: {
                date: new Date(date),
                amount,
                method,
                reference,
                notes,
                invoiceId,
                tenantId: session.tenantId,
            },
        });

        await tx.invoice.update({
            where: { id: invoiceId },
            data: { paidAmount: newPaidAmount, status: newStatus },
        });

        return payment;
    });

    revalidatePath('/dashboard/piutang');
    revalidatePath('/dashboard/jurnal');
    revalidatePath('/dashboard');
    return {
        success: true,
        data: { id: result.id },
        message: newStatus === 'PAID' ? `Invoice ${invoice.number} telah LUNAS` : `Pembayaran sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`,
    };
}

export async function getAgingReport() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const now = new Date();
    const invoices = await prisma.invoice.findMany({
        where: {
            tenantId: session.tenantId,
            status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        },
        include: { contact: true },
        orderBy: { dueDate: 'asc' },
    });

    const buckets = {
        current: [] as typeof invoices,
        '1-30': [] as typeof invoices,
        '31-60': [] as typeof invoices,
        '61-90': [] as typeof invoices,
        '91+': [] as typeof invoices,
    };

    invoices.forEach((inv) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
        const item = { ...inv, daysOverdue, outstanding };

        if (daysOverdue <= 0) buckets.current.push(item as any);
        else if (daysOverdue <= 30) buckets['1-30'].push(item as any);
        else if (daysOverdue <= 60) buckets['31-60'].push(item as any);
        else if (daysOverdue <= 90) buckets['61-90'].push(item as any);
        else buckets['91+'].push(item as any);
    });

    const summary = {
        current: { count: buckets.current.length, total: buckets.current.reduce((s, i: any) => s + i.outstanding, 0) },
        '1-30': { count: buckets['1-30'].length, total: buckets['1-30'].reduce((s, i: any) => s + i.outstanding, 0) },
        '31-60': { count: buckets['31-60'].length, total: buckets['31-60'].reduce((s, i: any) => s + i.outstanding, 0) },
        '61-90': { count: buckets['61-90'].length, total: buckets['61-90'].reduce((s, i: any) => s + i.outstanding, 0) },
        '91+': { count: buckets['91+'].length, total: buckets['91+'].reduce((s, i: any) => s + i.outstanding, 0) },
    };

    return { success: true as const, data: deepSerialize({ buckets, summary, invoices }), message: '' };
}

export async function getDashboardSummary() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const now = new Date();
    const [totalAR, overdueAR, invoiceCount, recentInvoices] = await Promise.all([
        prisma.invoice.aggregate({
            where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
            _sum: { totalAmount: true, paidAmount: true },
        }),
        prisma.invoice.aggregate({
            where: { tenantId: session.tenantId, status: 'OVERDUE', dueDate: { lt: now } },
            _sum: { totalAmount: true, paidAmount: true },
        }),
        prisma.invoice.count({ where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } } }),
        prisma.invoice.findMany({
            where: { tenantId: session.tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
            include: { contact: true },
            orderBy: { dueDate: 'asc' },
            take: 5,
        }),
    ]);

    const outstanding =
        Number(totalAR._sum.totalAmount || 0) - Number(totalAR._sum.paidAmount || 0);
    const overdueOutstanding =
        Number(overdueAR._sum.totalAmount || 0) - Number(overdueAR._sum.paidAmount || 0);

    return {
        success: true as const,
        data: deepSerialize({
            outstanding,
            overdueOutstanding,
            invoiceCount,
            recentInvoices,
        }),
        message: '',
    };
}

