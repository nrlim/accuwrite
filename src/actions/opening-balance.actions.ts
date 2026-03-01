'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// =================== SCHEMA ===================

const SetOpeningBalanceSchema = z.object({
    accountId: z.string().min(1),
    balance: z.coerce.number({ message: 'Saldo harus berupa angka' }).min(0, 'Saldo tidak boleh negatif'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().optional(),
});

export type SetOpeningBalanceData = z.infer<typeof SetOpeningBalanceSchema>;

export type ActionResult<T = void> =
    | { success: true; data: T; message: string }
    | { success: false; error: string };

// =================== HELPER ===================

/**
 * Menentukan posisi normal saldo akun berdasarkan jenisnya.
 * ASSET   → normal debit (D+/C-)
 * EXPENSE → normal debit (D+/C-)
 * LIABILITY → normal kredit (C+/D-)
 * EQUITY  → normal kredit (C+/D-)
 * REVENUE → normal kredit (C+/D-)
 */
function getAccountNormalBalance(
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
): 'DEBIT' | 'CREDIT' {
    return ['ASSET', 'EXPENSE'].includes(type) ? 'DEBIT' : 'CREDIT';
}

/**
 * Menemukan atau membuat akun "Opening Balance Equity" (Modal Awal)
 * yang digunakan sebagai offset entry saldo awal.
 */
async function getOrCreateOpeningBalanceAccount(tenantId: string): Promise<string> {
    const OBE_CODE = '3000';
    const OBE_NAME = 'Modal Awal (Opening Balance Equity)';

    const existing = await prisma.account.findFirst({
        where: { code: OBE_CODE, tenantId },
    });

    if (existing) return existing.id;

    // Buat otomatis jika belum ada
    const created = await prisma.account.create({
        data: {
            code: OBE_CODE,
            name: OBE_NAME,
            type: 'EQUITY',
            category: 'DETAIL',
            initialBalance: 0,
            tenantId,
        },
    });

    return created.id;
}

// =================== MAIN ACTION ===================

/**
 * Set Opening Balance untuk satu akun.
 * 
 * Logika jurnal:
 *   - Jika akun ber-saldo normal DEBIT (Aset/Beban):
 *       Debit  → Akun target
 *       Kredit → Opening Balance Equity
 *   - Jika akun ber-saldo normal KREDIT (Kewajiban/Modal/Pendapatan):
 *       Debit  → Opening Balance Equity
 *       Kredit → Akun target
 */
export async function setOpeningBalance(
    formData: SetOpeningBalanceData
): Promise<ActionResult<{ journalEntryId: string }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = SetOpeningBalanceSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { accountId, balance, date, description } = parsed.data;

    // Validasi akun target
    const account = await prisma.account.findFirst({
        where: { id: accountId, tenantId: session.tenantId },
    });
    if (!account) return { success: false, error: 'Akun tidak ditemukan' };
    if (account.category === 'HEADER') {
        return { success: false, error: 'Akun Header tidak bisa memiliki saldo. Pilih akun Detail.' };
    }

    // Cek apakah sudah ada opening balance journal untuk akun ini
    const existingOB = await prisma.journalItem.findFirst({
        where: {
            accountId,
            journalEntry: {
                tenantId: session.tenantId,
                sourceType: 'OPENING_BALANCE',
                status: 'POSTED',
            },
        },
        include: { journalEntry: true },
    });

    if (existingOB) {
        return {
            success: false,
            error: `Akun ini sudah memiliki saldo awal (Ref: ${existingOB.journalEntry.reference}). Gunakan jurnal koreksi untuk mengubahnya.`,
        };
    }

    // Dapatkan / buat akun Opening Balance Equity
    const obeAccountId = await getOrCreateOpeningBalanceAccount(session.tenantId);

    // Hitung sisi debit/kredit berdasarkan tipe akun
    const normalBalance = getAccountNormalBalance(account.type as any);
    const isDebitNormal = normalBalance === 'DEBIT';

    const ref = `OB-${account.code}-${new Date(date).getFullYear()}`;
    const entryDescription = description?.trim() ||
        `Saldo awal ${account.name} per ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    try {
        // Buat journal dalam satu $transaction atomik
        const journalEntry = await prisma.$transaction(async (tx) => {
            const entry = await tx.journalEntry.create({
                data: {
                    date: new Date(date),
                    reference: ref,
                    description: entryDescription,
                    status: 'POSTED',
                    sourceType: 'OPENING_BALANCE',
                    tenantId: session.tenantId,
                },
            });

            // Opening Balance Journal Items
            // Akun ber-normal DEBIT: Debit akun → Kredit OBE
            // Akun ber-normal KREDIT: Debit OBE → Kredit akun
            await tx.journalItem.createMany({
                data: [
                    {
                        journalEntryId: entry.id,
                        accountId: isDebitNormal ? accountId : obeAccountId,
                        debit: balance,
                        credit: 0,
                        memo: isDebitNormal ? `Opening Balance: ${account.name}` : 'Opening Balance Equity Offset',
                    },
                    {
                        journalEntryId: entry.id,
                        accountId: isDebitNormal ? obeAccountId : accountId,
                        debit: 0,
                        credit: balance,
                        memo: isDebitNormal ? 'Opening Balance Equity Offset' : `Opening Balance: ${account.name}`,
                    },
                ],
            });

            // Update field initialBalance di akun untuk referensi cepat
            await tx.account.update({
                where: { id: accountId },
                data: { initialBalance: balance },
            });

            return entry;
        });

        revalidatePath('/dashboard/bagan-akun');
        revalidatePath('/dashboard/jurnal');

        return {
            success: true,
            data: { journalEntryId: journalEntry.id },
            message: `Saldo awal Rp ${balance.toLocaleString('id-ID')} untuk "${account.name}" berhasil diposting (Ref: ${ref})`,
        };
    } catch (err: any) {
        if (err?.code === 'P2002') {
            return { success: false, error: `Referensi jurnal "${ref}" sudah ada. Coba ubah tanggal.` };
        }
        return { success: false, error: 'Gagal memposting saldo awal. Silakan coba lagi.' };
    }
}

// =================== BULK OPENING BALANCE ===================

const BulkOpeningBalanceSchema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    entries: z.array(z.object({
        accountId: z.string().min(1),
        balance: z.coerce.number().min(0),
    })).min(1, 'Minimal 1 entri saldo awal'),
});

export type BulkOpeningBalanceData = z.infer<typeof BulkOpeningBalanceSchema>;

/**
 * Set Opening Balance untuk banyak akun sekaligus dalam 1 $transaction.
 * Semua entri masuk ke satu JournalEntry dengan banyak baris.
 */
export async function setBulkOpeningBalance(
    formData: BulkOpeningBalanceData
): Promise<ActionResult<{ journalEntryId: string; count: number }>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const parsed = BulkOpeningBalanceSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { date, entries } = parsed.data;

    // Filter entri yang punya saldo > 0
    const validEntries = entries.filter((e) => e.balance > 0);
    if (validEntries.length === 0) {
        return { success: false, error: 'Tidak ada saldo yang diisi' };
    }

    // Fetch semua akun sekaligus
    const accountIds = validEntries.map((e) => e.accountId);
    const accounts = await prisma.account.findMany({
        where: { id: { in: accountIds }, tenantId: session.tenantId },
    });

    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    // Validasi semua akun adalah DETAIL
    const headerAccs = accounts.filter((a) => a.category === 'HEADER');
    if (headerAccs.length > 0) {
        return {
            success: false,
            error: `Akun Header tidak bisa memiliki saldo: ${headerAccs.map((a) => a.name).join(', ')}`,
        };
    }

    const obeAccountId = await getOrCreateOpeningBalanceAccount(session.tenantId);
    const ref = `OB-BULK-${new Date(date).getFullYear()}${String(new Date(date).getMonth() + 1).padStart(2, '0')}`;

    // Total OBE offset
    let totalDebitOffset = 0;
    let totalCreditOffset = 0;

    const journalItemsData: Array<{
        accountId: string;
        debit: number;
        credit: number;
        memo: string;
    }> = [];

    for (const entry of validEntries) {
        const account = accountMap.get(entry.accountId);
        if (!account) continue;

        const isDebitNormal = getAccountNormalBalance(account.type as any) === 'DEBIT';

        if (isDebitNormal) {
            // Debit akun, kredit offset ke OBE
            journalItemsData.push({
                accountId: entry.accountId,
                debit: entry.balance,
                credit: 0,
                memo: `Saldo awal: ${account.name}`,
            });
            totalCreditOffset += entry.balance; // OBE akan dikreditkan
        } else {
            // Kredit akun, debit offset dari OBE
            journalItemsData.push({
                accountId: entry.accountId,
                debit: 0,
                credit: entry.balance,
                memo: `Saldo awal: ${account.name}`,
            });
            totalDebitOffset += entry.balance; // OBE akan didebit
        }
    }

    // Hitung saldo OBE (bisa jadi satu entri atau dua jika ada keduanya)
    const netOBECredit = totalCreditOffset - totalDebitOffset;
    if (netOBECredit > 0) {
        journalItemsData.push({
            accountId: obeAccountId,
            debit: 0,
            credit: netOBECredit,
            memo: 'Opening Balance Equity',
        });
    } else if (netOBECredit < 0) {
        journalItemsData.push({
            accountId: obeAccountId,
            debit: Math.abs(netOBECredit),
            credit: 0,
            memo: 'Opening Balance Equity',
        });
    }

    try {
        const journalEntry = await prisma.$transaction(async (tx) => {
            // Cek duplikasi referensi
            const dupRef = await tx.journalEntry.findFirst({
                where: { reference: ref, tenantId: session.tenantId },
            });
            if (dupRef) {
                throw new Error(`DUPLICATE_REF:${ref}`);
            }

            const entry = await tx.journalEntry.create({
                data: {
                    date: new Date(date),
                    reference: ref,
                    description: `Saldo Awal Per ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                    status: 'POSTED',
                    sourceType: 'OPENING_BALANCE',
                    tenantId: session.tenantId,
                },
            });

            await tx.journalItem.createMany({
                data: journalItemsData.map((item) => ({
                    journalEntryId: entry.id,
                    ...item,
                })),
            });

            // Update semua initialBalance sekaligus
            await Promise.all(
                validEntries.map((e) =>
                    tx.account.update({
                        where: { id: e.accountId },
                        data: { initialBalance: e.balance },
                    })
                )
            );

            return entry;
        });

        revalidatePath('/dashboard/bagan-akun');
        revalidatePath('/dashboard/jurnal');

        return {
            success: true,
            data: { journalEntryId: journalEntry.id, count: validEntries.length },
            message: `Saldo awal ${validEntries.length} akun berhasil diposting (Ref: ${ref})`,
        };
    } catch (err: any) {
        if (err?.message?.startsWith('DUPLICATE_REF:')) {
            return {
                success: false,
                error: `Saldo awal untuk periode ini sudah ada (${err.message.split(':')[1]}). Gunakan tanggal berbeda.`,
            };
        }
        return { success: false, error: 'Gagal memposting saldo awal. Silakan coba lagi.' };
    }
}
