'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { deepSerialize } from '@/lib/serialize';

export async function getDashboardStats() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const tenantId = session.tenantId;
    const now = new Date();

    // Rentang bulan ini
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Rentang bulan lalu
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. TOTAL ASET
    const assetAccounts = await prisma.account.findMany({
        where: { tenantId, type: 'ASSET', category: 'DETAIL' },
        select: { id: true, initialBalance: true }
    });
    const assetAccountIds = assetAccounts.map(a => a.id);

    const assetAggregates = await prisma.journalItem.aggregate({
        where: { accountId: { in: assetAccountIds }, journalEntry: { status: 'POSTED', tenantId } },
        _sum: { debit: true, credit: true }
    });

    const totalAssetInitial = assetAccounts.reduce((sum, a) => sum + Number(a.initialBalance), 0);
    const totalAssetDebit = Number(assetAggregates._sum.debit || 0);
    const totalAssetCredit = Number(assetAggregates._sum.credit || 0);
    const totalAssets = totalAssetInitial + totalAssetDebit - totalAssetCredit;

    // 2. TOTAL PIUTANG
    const arAggregates = await prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
        _sum: { totalAmount: true, paidAmount: true }
    });
    const totalReceivables = Number(arAggregates._sum.totalAmount || 0) - Number(arAggregates._sum.paidAmount || 0);

    // 3. PENDAPATAN & PENGELUARAN (Tahun Berjalan / Bulan Ini)
    // Ambil data akun terlebih dahulu untuk mapping tipe
    const plAccounts = await prisma.account.findMany({
        where: { tenantId, type: { in: ['REVENUE', 'EXPENSE'] }, category: 'DETAIL' },
        select: { id: true, type: true }
    });

    const revenueAccountIds = plAccounts.filter(a => a.type === 'REVENUE').map(a => a.id);
    const expenseAccountIds = plAccounts.filter(a => a.type === 'EXPENSE').map(a => a.id);

    const plAggregatesThisMonth = await prisma.journalItem.groupBy({
        by: ['accountId'],
        where: {
            accountId: { in: plAccounts.map(a => a.id) },
            journalEntry: { tenantId, status: 'POSTED', date: { gte: startOfThisMonth, lte: endOfThisMonth } }
        },
        _sum: { debit: true, credit: true }
    });

    let revenueThisMonth = 0;
    let expenseThisMonth = 0;

    plAggregatesThisMonth.forEach(agg => {
        const debit = Number(agg._sum.debit || 0);
        const credit = Number(agg._sum.credit || 0);
        if (revenueAccountIds.includes(agg.accountId)) {
            revenueThisMonth += (credit - debit);
        } else if (expenseAccountIds.includes(agg.accountId)) {
            expenseThisMonth += (debit - credit);
        }
    });

    const netIncomeThisMonth = revenueThisMonth - expenseThisMonth;

    // 4. KAS & BANK
    const cashAccounts = await prisma.account.findMany({
        where: { tenantId, category: 'DETAIL', code: { gte: '1000', lte: '1099' } },
        select: { id: true, initialBalance: true }
    });
    const cashAccountIds = cashAccounts.map(a => a.id);
    const cashInitialSum = cashAccounts.reduce((sum, a) => sum + Number(a.initialBalance), 0);

    // Saldo Kas & Bank bulan ini
    const cashAggThisMonth = await prisma.journalItem.aggregate({
        where: {
            accountId: { in: cashAccountIds },
            journalEntry: { tenantId, status: 'POSTED', date: { lte: endOfThisMonth } }
        },
        _sum: { debit: true, credit: true }
    });
    const cashBalanceThisMonth = cashInitialSum + Number(cashAggThisMonth._sum.debit || 0) - Number(cashAggThisMonth._sum.credit || 0);

    // Saldo Kas & Bank bulan lalu
    const cashAggLastMonth = await prisma.journalItem.aggregate({
        where: {
            accountId: { in: cashAccountIds },
            journalEntry: { tenantId, status: 'POSTED', date: { lte: endOfLastMonth } }
        },
        _sum: { debit: true, credit: true }
    });
    const cashBalanceLastMonth = cashInitialSum + Number(cashAggLastMonth._sum.debit || 0) - Number(cashAggLastMonth._sum.credit || 0);

    let cashGrowth = 0;
    if (cashBalanceLastMonth > 0) {
        cashGrowth = ((cashBalanceThisMonth - cashBalanceLastMonth) / cashBalanceLastMonth) * 100;
    } else if (cashBalanceThisMonth > 0) {
        cashGrowth = 100;
    }

    // 5. CHART DATA (6 Bulan Terakhir)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthAgg = await prisma.journalItem.groupBy({
            by: ['accountId'],
            where: {
                accountId: { in: plAccounts.map(a => a.id) },
                journalEntry: { tenantId, status: 'POSTED', date: { gte: targetDate, lte: endOfTargetMonth } }
            },
            _sum: { debit: true, credit: true }
        });

        let rev = 0;
        let exp = 0;
        monthAgg.forEach(agg => {
            const deb = Number(agg._sum.debit || 0);
            const cre = Number(agg._sum.credit || 0);
            if (revenueAccountIds.includes(agg.accountId)) {
                rev += (cre - deb);
            } else if (expenseAccountIds.includes(agg.accountId)) {
                exp += (deb - cre);
            }
        });

        chartData.push({
            month: targetDate.toLocaleDateString('id-ID', { month: 'short' }),
            revenue: rev,
            expense: exp
        });
    }

    // 6. Recent Invoices
    const recentInvoices = await prisma.invoice.findMany({
        where: { tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { contact: { select: { name: true } } }
    });

    const overdueCount = await prisma.invoice.count({
        where: { tenantId, status: 'OVERDUE' }
    });

    const data = {
        totalAssets,
        totalReceivables,
        netIncomeThisMonth,
        cashBalanceThisMonth,
        cashGrowth,
        chartData,
        recentInvoices,
        overdueCount
    };

    return { success: true as const, data: deepSerialize(data), message: '' };
}
