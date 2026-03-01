'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize } from '@/lib/serialize';

// =================== ZOD SCHEMAS ===================

const CashTransactionSchema = z.object({
    type: z.enum(['IN', 'OUT'] as const),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    amount: z.coerce.number({ message: 'Nominal harus berupa angka' }).positive('Nominal harus lebih dari 0'),
    description: z.string().min(1, 'Keterangan wajib diisi').max(200),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    cashAccountId: z.string().min(1, 'Pilih akun kas/bank'),
    counterAccountId: z.string().min(1, 'Pilih akun lawan'),
    contactId: z.string().optional().nullable(),
});

export type CashTransactionData = z.infer<typeof CashTransactionSchema>;

export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== HELPERS ===================

async function generateCashRef(tenantId: string, type: 'IN' | 'OUT'): Promise<string> {
    const prefix = type === 'IN' ? 'KM' : 'KK'; // Kas Masuk / Kas Keluar
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.cashTransaction.count({
        where: {
            tenantId,
            type,
            reference: { startsWith: `${prefix}-${year}${month}` },
        },
    });
    return `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =================== READ ===================

export async function getCashAccounts() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    // Akun Kas & Bank = ASSET + DETAIL
    const accounts = await prisma.account.findMany({
        where: {
            tenantId: session.tenantId,
            type: 'ASSET',
            category: 'DETAIL',
        },
        orderBy: { code: 'asc' },
    });
    return { success: true as const, data: deepSerialize(accounts), message: '' };
}

export async function getAllDetailAccounts() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const accounts = await prisma.account.findMany({
        where: { tenantId: session.tenantId, category: 'DETAIL' },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
    return { success: true as const, data: deepSerialize(accounts), message: '' };
}

export async function getCashTransactions(
    cashAccountId?: string,
    page = 1,
    limit = 50,
    reconciled?: boolean
) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const where: Record<string, any> = { tenantId: session.tenantId };
    if (cashAccountId) where.cashAccountId = cashAccountId;
    if (reconciled !== undefined) where.reconciled = reconciled;

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
        prisma.cashTransaction.findMany({
            where,
            include: {
                cashAccount: { select: { id: true, code: true, name: true } },
                counterAccount: { select: { id: true, code: true, name: true, type: true } },
                contact: { select: { id: true, name: true } },
                journalEntry: { select: { id: true, reference: true, status: true } },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.cashTransaction.count({ where }),
    ]);

    return {
        success: true as const,
        data: deepSerialize({ transactions, total, page, limit }),
        message: '',
    };
}

export async function getCashBalance(cashAccountId: string) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const account = await prisma.account.findFirst({
        where: { id: cashAccountId, tenantId: session.tenantId },
    });
    if (!account) return { success: false as const, error: 'Akun tidak ditemukan' };

    const agg = await prisma.cashTransaction.aggregate({
        where: { cashAccountId, tenantId: session.tenantId },
        _sum: { amount: true },
    });

    const totalIn = await prisma.cashTransaction.aggregate({
        where: { cashAccountId, tenantId: session.tenantId, type: 'IN' },
        _sum: { amount: true },
    });
    const totalOut = await prisma.cashTransaction.aggregate({
        where: { cashAccountId, tenantId: session.tenantId, type: 'OUT' },
        _sum: { amount: true },
    });

    const openingBalance = Number(account.initialBalance);
    const totalInAmount = Number(totalIn._sum.amount ?? 0);
    const totalOutAmount = Number(totalOut._sum.amount ?? 0);
    const currentBalance = openingBalance + totalInAmount - totalOutAmount;

    return {
        success: true as const,
        data: deepSerialize({
            account,
            openingBalance,
            totalIn: totalInAmount,
            totalOut: totalOutAmount,
            currentBalance,
        }),
        message: '',
    };
}

// =================== CREATE ===================

export async function createCashTransaction(
    formData: CashTransactionData
): Promise<ActionResult<{ id: string; journalEntryId: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = CashTransactionSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { type, date, amount, description, reference, notes, cashAccountId, counterAccountId, contactId } = parsed.data;

    // Validate accounts
    const [cashAccount, counterAccount] = await Promise.all([
        prisma.account.findFirst({ where: { id: cashAccountId, tenantId: session.tenantId } }),
        prisma.account.findFirst({ where: { id: counterAccountId, tenantId: session.tenantId } }),
    ]);

    if (!cashAccount) return { success: false, error: 'Akun Kas/Bank tidak ditemukan' };
    if (!counterAccount) return { success: false, error: 'Akun Lawan tidak ditemukan' };
    if (cashAccount.category === 'HEADER') return { success: false, error: 'Akun Kas/Bank harus tipe Detail' };
    if (counterAccount.category === 'HEADER') return { success: false, error: 'Akun Lawan harus tipe Detail' };
    if (cashAccountId === counterAccountId) return { success: false, error: 'Akun Kas dan Akun Lawan tidak boleh sama' };

    const autoRef = await generateCashRef(session.tenantId, type);
    const txRef = (reference?.trim()) || autoRef;

    /*
     * JOURNAL LOGIC:
     *   Uang Masuk (IN):
     *     Debit  → cashAccount      (Kas/Bank bertambah)
     *     Kredit → counterAccount   (Pendapatan / Piutang / dll)
     *
     *   Uang Keluar (OUT):
     *     Debit  → counterAccount   (Beban / Hutang / dll bertambah)
     *     Kredit → cashAccount      (Kas/Bank berkurang)
     */
    const debitAccountId = type === 'IN' ? cashAccountId : counterAccountId;
    const creditAccountId = type === 'IN' ? counterAccountId : cashAccountId;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create JournalEntry
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: new Date(date),
                    reference: txRef,
                    description,
                    status: 'POSTED',
                    sourceType: type === 'IN' ? 'CASH_IN' : 'CASH_OUT',
                    tenantId: session.tenantId,
                },
            });

            // 2. Create JournalItems (double-entry)
            await tx.journalItem.createMany({
                data: [
                    {
                        journalEntryId: journalEntry.id,
                        accountId: debitAccountId,
                        contactId: contactId || null,
                        debit: amount,
                        credit: 0,
                        memo: description,
                    },
                    {
                        journalEntryId: journalEntry.id,
                        accountId: creditAccountId,
                        contactId: contactId || null,
                        debit: 0,
                        credit: amount,
                        memo: description,
                    },
                ],
            });

            // 3. Create CashTransaction record (user-friendly)
            const cashTx = await tx.cashTransaction.create({
                data: {
                    date: new Date(date),
                    type,
                    amount,
                    description,
                    reference: txRef,
                    notes: notes || null,
                    cashAccountId,
                    counterAccountId,
                    contactId: contactId || null,
                    journalEntryId: journalEntry.id,
                    tenantId: session.tenantId,
                },
            });

            return { cashTxId: cashTx.id, journalEntryId: journalEntry.id };
        });

        revalidatePath('/dashboard/kas-bank');
        revalidatePath('/dashboard/jurnal');

        return {
            success: true,
            data: { id: result.cashTxId, journalEntryId: result.journalEntryId },
            message: `${type === 'IN' ? 'Uang Masuk' : 'Uang Keluar'} Rp ${amount.toLocaleString('id-ID')} berhasil dicatat (${txRef})`,
        };
    } catch (err: any) {
        if (err?.code === 'P2002') {
            return { success: false, error: `Referensi "${txRef}" sudah ada. Gunakan referensi lain.` };
        }
        console.error('[createCashTransaction]', err);
        return { success: false, error: 'Gagal mencatat transaksi. Silakan coba lagi.' };
    }
}

// =================== RECONCILIATION ===================

export async function toggleReconciliation(
    id: string,
    reconciled: boolean
): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const tx = await prisma.cashTransaction.findFirst({
        where: { id, tenantId: session.tenantId },
    });
    if (!tx) return { success: false, error: 'Transaksi tidak ditemukan' };

    await prisma.cashTransaction.update({
        where: { id },
        data: {
            reconciled,
            reconciledAt: reconciled ? new Date() : null,
        },
    });

    revalidatePath('/dashboard/kas-bank');
    return {
        success: true,
        data: undefined,
        message: reconciled ? 'Transaksi ditandai sesuai' : 'Tandai sesuai dibatalkan',
    };
}

export async function bulkReconcile(
    ids: string[],
    reconciled: boolean
): Promise<ActionResult<{ count: number }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const result = await prisma.cashTransaction.updateMany({
        where: { id: { in: ids }, tenantId: session.tenantId },
        data: {
            reconciled,
            reconciledAt: reconciled ? new Date() : null,
        },
    });

    revalidatePath('/dashboard/kas-bank');
    return {
        success: true,
        data: { count: result.count },
        message: `${result.count} transaksi berhasil ${reconciled ? 'ditandai sesuai' : 'dibatalkan tandanya'}`,
    };
}

export async function getReconciliationSummary(cashAccountId: string) {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const [balanceResult, reconciled, unreconciled] = await Promise.all([
        getCashBalance(cashAccountId),
        prisma.cashTransaction.aggregate({
            where: { cashAccountId, tenantId: session.tenantId, reconciled: true },
            _count: { _all: true },
            _sum: { amount: true },
        }),
        prisma.cashTransaction.count({
            where: { cashAccountId, tenantId: session.tenantId, reconciled: false },
        }),
    ]);

    return {
        success: true as const,
        data: {
            balance: balanceResult.success ? balanceResult.data : null,
            reconciledCount: reconciled._count._all,
            unreconciledCount: unreconciled,
            reconciledTotal: Number(reconciled._sum.amount ?? 0),
        },
        message: '',
    };
}

export async function voidCashTransaction(id: string): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const tx = await prisma.cashTransaction.findFirst({
        where: { id, tenantId: session.tenantId },
        include: { journalEntry: true },
    });
    if (!tx) return { success: false, error: 'Transaksi tidak ditemukan' };
    if (tx.reconciled) return { success: false, error: 'Transaksi yang sudah direkonsiliasi tidak bisa dihapus' };

    await prisma.$transaction(async (prismaClient) => {
        if (tx.journalEntryId) {
            await prismaClient.journalEntry.update({
                where: { id: tx.journalEntryId },
                data: { status: 'VOID' },
            });
        }
        // Soft-delete: we keep the record but mark it as reconciled:false + detach journal
        // Actually hard delete for simplicity
        await prismaClient.cashTransaction.delete({ where: { id } });
    });

    revalidatePath('/dashboard/kas-bank');
    revalidatePath('/dashboard/jurnal');
    return { success: true, data: undefined, message: 'Transaksi berhasil dihapus' };
}
