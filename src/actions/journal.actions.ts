'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize, serializeJournalEntry } from '@/lib/serialize';


// =================== ZOD SCHEMAS ===================

const JournalItemSchema = z.object({
    accountId: z.string().min(1, 'Pilih akun'),
    contactId: z.string().optional().nullable(),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
    memo: z.string().optional().nullable(),
});

const JournalEntrySchema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    reference: z.string().min(1, 'Referensi wajib diisi').max(50),
    description: z.string().min(1, 'Deskripsi wajib diisi'),
    items: z.array(JournalItemSchema).min(2, 'Minimal 2 baris jurnal'),
}).superRefine((data, ctx) => {
    const totalDebit = data.items.reduce((sum, i) => sum + (i.debit || 0), 0);
    const totalCredit = data.items.reduce((sum, i) => sum + (i.credit || 0), 0);

    // Double-entry guard
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Total Debit (${totalDebit.toFixed(2)}) harus sama dengan Total Kredit (${totalCredit.toFixed(2)})`,
            path: ['items'],
        });
    }

    if (totalDebit === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Jumlah tidak boleh nol',
            path: ['items'],
        });
    }
});

export type JournalItemData = z.infer<typeof JournalItemSchema>;
export type JournalEntryData = z.infer<typeof JournalEntrySchema>;
export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== HELPERS ===================

async function generateReference(tenantId: string, prefix: string = 'JV') {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.journalEntry.count({
        where: { tenantId, reference: { startsWith: `${prefix}-${year}${month}` } },
    });
    return `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =================== ACTIONS ===================

export async function getJournalEntries(page = 1, limit = 20) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
        prisma.journalEntry.findMany({
            where: { tenantId: session.tenantId },
            include: {
                items: {
                    include: { account: true, contact: true },
                },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.journalEntry.count({ where: { tenantId: session.tenantId } }),
    ]);

    const serializedEntries = entries.map(serializeJournalEntry);

    return { success: true as const, data: { entries: serializedEntries, total, page, limit }, message: '' };
}

export async function createJournalEntry(formData: JournalEntryData): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = JournalEntrySchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { date, reference, description, items } = parsed.data;

    // Validate all accounts belong to this tenant and are DETAIL type
    const accountIds = [...new Set(items.map((i) => i.accountId))];
    const accounts = await prisma.account.findMany({
        where: { id: { in: accountIds }, tenantId: session.tenantId },
    });
    if (accounts.length !== accountIds.length) {
        return { success: false, error: 'Satu atau lebih akun tidak valid' };
    }
    const headerAccounts = accounts.filter((a) => a.category === 'HEADER');
    if (headerAccounts.length > 0) {
        return {
            success: false,
            error: `Akun Header tidak bisa diposting: ${headerAccounts.map((a) => a.name).join(', ')}`,
        };
    }

    // Check duplicate reference
    const dupRef = await prisma.journalEntry.findFirst({
        where: { reference, tenantId: session.tenantId },
    });
    if (dupRef) return { success: false, error: `Referensi "${reference}" sudah digunakan` };

    // Gunakan $transaction agar JournalEntry + semua JournalItem tersimpan atomik
    const entry = await prisma.$transaction(async (tx) => {
        const newEntry = await tx.journalEntry.create({
            data: {
                date: new Date(date),
                reference,
                description,
                status: 'POSTED',
                sourceType: 'MANUAL',
                tenantId: session.tenantId,
            },
        });

        // Buat semua baris debit/kredit dalam transaksi yang sama
        await tx.journalItem.createMany({
            data: items.map((item) => ({
                journalEntryId: newEntry.id,
                accountId: item.accountId,
                contactId: item.contactId || null,
                debit: item.debit,
                credit: item.credit,
                memo: item.memo || null,
            })),
        });

        return newEntry;
    });

    revalidatePath('/dashboard/jurnal');
    revalidatePath('/dashboard/bagan-akun');
    revalidatePath('/dashboard');
    return { success: true, data: { id: entry.id }, message: `Jurnal "${reference}" berhasil diposting` };
}

export async function voidJournalEntry(id: string): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const entry = await prisma.journalEntry.findFirst({
        where: { id, tenantId: session.tenantId },
    });
    if (!entry) return { success: false, error: 'Jurnal tidak ditemukan' };
    if (entry.sourceType === 'INVOICE') {
        return { success: false, error: 'Tidak bisa membatalkan jurnal yang terkait dengan invoice. Batalkan invoice terlebih dahulu.' };
    }
    if (entry.status === 'VOID') return { success: false, error: 'Jurnal sudah dibatalkan' };

    await prisma.journalEntry.update({ where: { id }, data: { status: 'VOID' } });
    revalidatePath('/dashboard/jurnal');
    return { success: true, data: undefined, message: 'Jurnal berhasil dibatalkan' };
}

export async function getLedger(accountId: string, startDate?: string, endDate?: string) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const account = await prisma.account.findFirst({
        where: { id: accountId, tenantId: session.tenantId },
    });
    if (!account) return { success: false as const, error: 'Akun tidak ditemukan' };

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const items = await prisma.journalItem.findMany({
        where: {
            accountId,
            journalEntry: {
                tenantId: session.tenantId,
                status: 'POSTED',
                ...(startDate || endDate ? { date: dateFilter } : {}),
            },
        },
        include: {
            journalEntry: true,
            contact: true,
        },
        orderBy: [{ journalEntry: { date: 'asc' } }],
    });

    // Calculate running balance
    let runningBalance = Number(account.initialBalance);
    const ledgerItems = items.map((item) => {
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
            runningBalance += Number(item.debit) - Number(item.credit);
        } else {
            runningBalance += Number(item.credit) - Number(item.debit);
        }
        return { ...item, runningBalance };
    });

    return {
        success: true as const,
        data: deepSerialize({ account, items: ledgerItems, openingBalance: Number(account.initialBalance) }),
        message: '',
    };
}

