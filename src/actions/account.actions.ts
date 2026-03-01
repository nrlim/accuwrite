'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize } from '@/lib/serialize';

// =================== ZOD SCHEMAS ===================

const AccountSchema = z.object({
    code: z.string().min(1, 'Kode akun wajib diisi').max(20, 'Kode maksimal 20 karakter'),
    name: z.string().min(1, 'Nama akun wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const),
    category: z.enum(['HEADER', 'DETAIL'] as const).default('DETAIL'),
    parentId: z.string().optional().nullable(),
    initialBalance: z.coerce.number().default(0),
    description: z.string().optional().nullable(),
});

// =================== TYPES ===================

export type AccountFormData = z.infer<typeof AccountSchema>;

export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== ACTIONS ===================

export async function getAccounts() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const accounts = await prisma.account.findMany({
        where: { tenantId: session.tenantId },
        include: { children: true, parent: true },
        orderBy: [{ code: 'asc' }],
    });

    const aggregates = await prisma.journalItem.groupBy({
        by: ['accountId'],
        where: {
            journalEntry: {
                tenantId: session.tenantId,
                status: 'POSTED',
            },
        },
        _sum: { debit: true, credit: true },
    });

    const aggMap = new Map(
        aggregates.map((a) => [
            a.accountId,
            { debit: Number(a._sum.debit ?? 0), credit: Number(a._sum.credit ?? 0) },
        ])
    );

    const accountsWithBalance = accounts.map((acc) => {
        const agg = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
        const initial = Number(acc.initialBalance);
        let currentBalance = initial;

        if (['ASSET', 'EXPENSE'].includes(acc.type)) {
            currentBalance = initial + agg.debit - agg.credit;
        } else {
            currentBalance = initial - agg.debit + agg.credit;
        }

        return { ...acc, currentBalance };
    });

    return { success: true as const, data: deepSerialize(accountsWithBalance), message: '' };
}

export async function getAccountsFlat() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const accounts = await prisma.account.findMany({
        where: { tenantId: session.tenantId, category: 'DETAIL' },
        orderBy: [{ code: 'asc' }],
    });

    const aggregates = await prisma.journalItem.groupBy({
        by: ['accountId'],
        where: {
            journalEntry: {
                tenantId: session.tenantId,
                status: 'POSTED',
            },
        },
        _sum: { debit: true, credit: true },
    });

    const aggMap = new Map(
        aggregates.map((a) => [
            a.accountId,
            { debit: Number(a._sum.debit ?? 0), credit: Number(a._sum.credit ?? 0) },
        ])
    );

    const accountsWithBalance = accounts.map((acc) => {
        const agg = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
        const initial = Number(acc.initialBalance);
        let currentBalance = initial;

        if (['ASSET', 'EXPENSE'].includes(acc.type)) {
            currentBalance = initial + agg.debit - agg.credit;
        } else {
            currentBalance = initial - agg.debit + agg.credit;
        }

        return { ...acc, currentBalance };
    });

    return { success: true as const, data: deepSerialize(accountsWithBalance), message: '' };
}

export async function createAccount(formData: AccountFormData): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = AccountSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { code, name, type, category, parentId, initialBalance, description } = parsed.data;

    // Check duplicate code
    const exists = await prisma.account.findUnique({
        where: { code_tenantId: { code, tenantId: session.tenantId } },
    });
    if (exists) return { success: false, error: `Kode akun "${code}" sudah digunakan` };

    // Validate parent exists and is HEADER
    if (parentId) {
        const parent = await prisma.account.findFirst({
            where: { id: parentId, tenantId: session.tenantId },
        });
        if (!parent) return { success: false, error: 'Akun induk tidak ditemukan' };
        if (parent.category === 'DETAIL') return { success: false, error: 'Akun induk harus bertipe Header' };
    }

    const account = await prisma.account.create({
        data: {
            code,
            name,
            type,
            category,
            parentId: parentId || null,
            initialBalance,
            description,
            tenantId: session.tenantId,
        },
    });

    revalidatePath('/dashboard/bagan-akun');
    return { success: true, data: { id: account.id }, message: `Akun "${name}" berhasil dibuat` };
}

export async function updateAccount(
    id: string,
    formData: AccountFormData
): Promise<ActionResult<{ id: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = AccountSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { code, name, type, category, parentId, initialBalance, description } = parsed.data;

    // Check if account exists and belongs to tenant
    const existing = await prisma.account.findFirst({
        where: { id, tenantId: session.tenantId },
        include: { _count: { select: { journalItems: true } } },
    });
    if (!existing) return { success: false, error: 'Akun tidak ditemukan' };

    // Cannot change type if account has transactions
    if (existing._count.journalItems > 0 && existing.type !== type) {
        return { success: false, error: 'Tidak bisa mengubah jenis akun yang sudah memiliki transaksi' };
    }

    // Check duplicate code (excluding self)
    const dupCode = await prisma.account.findFirst({
        where: { code, tenantId: session.tenantId, NOT: { id } },
    });
    if (dupCode) return { success: false, error: `Kode akun "${code}" sudah digunakan` };

    const account = await prisma.account.update({
        where: { id },
        data: { code, name, type, category, parentId: parentId || null, initialBalance, description },
    });

    revalidatePath('/dashboard/bagan-akun');
    return { success: true, data: { id: account.id }, message: `Akun "${name}" berhasil diperbarui` };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const account = await prisma.account.findFirst({
        where: { id, tenantId: session.tenantId },
        include: {
            _count: { select: { journalItems: true, children: true } },
        },
    });

    if (!account) return { success: false, error: 'Akun tidak ditemukan' };
    if (account._count.journalItems > 0) return { success: false, error: 'Tidak bisa menghapus akun yang memiliki transaksi' };
    if (account._count.children > 0) return { success: false, error: 'Tidak bisa menghapus akun yang memiliki sub-akun' };

    await prisma.account.delete({ where: { id } });
    revalidatePath('/dashboard/bagan-akun');
    return { success: true, data: undefined, message: `Akun "${account.name}" berhasil dihapus` };
}

export async function updateOpeningBalance(
    id: string,
    balance: number
): Promise<ActionResult> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const account = await prisma.account.findFirst({
        where: { id, tenantId: session.tenantId },
    });
    if (!account) return { success: false, error: 'Akun tidak ditemukan' };

    await prisma.account.update({ where: { id }, data: { initialBalance: balance } });
    revalidatePath('/dashboard/bagan-akun');
    return { success: true, data: undefined, message: 'Saldo awal berhasil diperbarui' };
}
