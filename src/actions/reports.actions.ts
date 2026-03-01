'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// =================== TYPES ===================

export interface AccountLine {
    id: string;
    code: string;
    name: string;
    type: string;
    category: string;
    parentId: string | null;
    initialBalance: number;
    balance: number;       // net computed balance
    debitTotal: number;    // period debits
    creditTotal: number;   // period credits
}

export interface PLReport {
    period: { startDate: string; endDate: string };
    revenue: AccountLine[];
    expenses: AccountLine[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    isProfit: boolean;
}

export interface BalanceSheet {
    asOfDate: string;
    assets: AccountLine[];
    liabilities: AccountLine[];
    equity: AccountLine[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;     // retained from P&L (YTD)
    isBalanced: boolean;   // Assets == Liabilities + Equity + NetIncome
    difference: number;    // for debugging
}

type ActionResult<T> = { success: true; data: T; message: string } | { success: false; error: string };

// =================== HELPERS ===================

/**
 * Normal balance rules:
 * ASSET, EXPENSE   → Debit-normal: balance increases with debit
 * LIABILITY, EQUITY, REVENUE → Credit-normal: balance increases with credit
 */
function computeBalance(
    type: string,
    initialBalance: number,
    totalDebit: number,
    totalCredit: number
): number {
    if (['ASSET', 'EXPENSE'].includes(type)) {
        return initialBalance + totalDebit - totalCredit;
    }
    return initialBalance + totalCredit - totalDebit;
}

// =================== P&L (LABA RUGI) ===================

export async function getProfitLossReport(
    startDate: string,
    endDate: string
): Promise<ActionResult<PLReport>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Include the entire end day
    end.setHours(23, 59, 59, 999);

    if (start > end) return { success: false, error: 'Tanggal mulai harus sebelum tanggal akhir' };

    // Fetch all REVENUE & EXPENSE accounts
    const accounts = await prisma.account.findMany({
        where: {
            tenantId: session.tenantId,
            type: { in: ['REVENUE', 'EXPENSE'] },
            category: 'DETAIL',
        },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    if (accounts.length === 0) {
        return {
            success: true,
            data: {
                period: { startDate, endDate },
                revenue: [],
                expenses: [],
                totalRevenue: 0,
                totalExpenses: 0,
                netIncome: 0,
                isProfit: true,
            },
            message: '',
        };
    }

    const accountIds = accounts.map((a) => a.id);

    // Aggregate debit/credit per account for the period
    const aggregates = await prisma.journalItem.groupBy({
        by: ['accountId'],
        where: {
            accountId: { in: accountIds },
            journalEntry: {
                tenantId: session.tenantId,
                status: 'POSTED',
                date: { gte: start, lte: end },
            },
        },
        _sum: { debit: true, credit: true },
    });

    // Map aggregates by accountId
    const aggMap = new Map(
        aggregates.map((a) => [
            a.accountId,
            {
                debit: Number(a._sum.debit ?? 0),
                credit: Number(a._sum.credit ?? 0),
            },
        ])
    );

    const buildLine = (acc: (typeof accounts)[0]): AccountLine => {
        const agg = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
        // For P&L we don't use initialBalance — just period activity
        const balance = computeBalance(acc.type, 0, agg.debit, agg.credit);
        return {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            category: acc.category,
            parentId: acc.parentId,
            initialBalance: 0,
            balance,
            debitTotal: agg.debit,
            creditTotal: agg.credit,
        };
    };

    const revenue = accounts.filter((a) => a.type === 'REVENUE').map(buildLine);
    const expenses = accounts.filter((a) => a.type === 'EXPENSE').map(buildLine);

    const totalRevenue = revenue.reduce((s, a) => s + a.balance, 0);
    const totalExpenses = expenses.reduce((s, a) => s + a.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
        success: true,
        data: {
            period: { startDate, endDate },
            revenue,
            expenses,
            totalRevenue,
            totalExpenses,
            netIncome,
            isProfit: netIncome >= 0,
        },
        message: '',
    };
}

// =================== BALANCE SHEET (NERACA) ===================

export async function getBalanceSheet(
    asOfDate?: string
): Promise<ActionResult<BalanceSheet>> {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak valid' };

    const cutoff = asOfDate ? new Date(asOfDate) : new Date();
    cutoff.setHours(23, 59, 59, 999);

    // Fetch all DETAIL accounts
    const accounts = await prisma.account.findMany({
        where: {
            tenantId: session.tenantId,
            category: 'DETAIL',
        },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    const accountIds = accounts.map((a) => a.id);

    // All posted journal items up to asOfDate
    const aggregates = await prisma.journalItem.groupBy({
        by: ['accountId'],
        where: {
            accountId: { in: accountIds },
            journalEntry: {
                tenantId: session.tenantId,
                status: 'POSTED',
                date: { lte: cutoff },
            },
        },
        _sum: { debit: true, credit: true },
    });

    const aggMap = new Map(
        aggregates.map((a) => [
            a.accountId,
            {
                debit: Number(a._sum.debit ?? 0),
                credit: Number(a._sum.credit ?? 0),
            },
        ])
    );

    const buildLine = (acc: (typeof accounts)[0]): AccountLine => {
        const agg = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
        const initialBalance = Number(acc.initialBalance);
        const balance = computeBalance(acc.type, initialBalance, agg.debit, agg.credit);
        return {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            category: acc.category,
            parentId: acc.parentId,
            initialBalance,
            balance,
            debitTotal: agg.debit,
            creditTotal: agg.credit,
        };
    };

    const assets = accounts.filter((a) => a.type === 'ASSET').map(buildLine);
    const liabilities = accounts.filter((a) => a.type === 'LIABILITY').map(buildLine);
    const equity = accounts.filter((a) => a.type === 'EQUITY').map(buildLine);

    // Net Income YTD (from beginning of current year to asOfDate)
    const yearStart = new Date(cutoff.getFullYear(), 0, 1);
    const plResult = await getProfitLossReport(
        yearStart.toISOString().split('T')[0],
        cutoff.toISOString().split('T')[0]
    );
    const netIncome = plResult.success ? plResult.data.netIncome : 0;

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    // The accounting equation: Assets = Liabilities + Equity + Net Income
    const rightSide = totalLiabilities + totalEquity + netIncome;
    const difference = Math.abs(totalAssets - rightSide);
    const isBalanced = difference < 1; // within Rp 1 tolerance

    return {
        success: true,
        data: {
            asOfDate: cutoff.toISOString().split('T')[0],
            assets,
            liabilities,
            equity,
            totalAssets,
            totalLiabilities,
            totalEquity,
            netIncome,
            isBalanced,
            difference,
        },
        message: '',
    };
}

// =================== ACCOUNT LIST (for selectors) ===================

export async function getDetailAccounts() {
    const session = await getSession();
    if (!session) return { success: false as const, error: 'Sesi tidak valid' };

    const accounts = await prisma.account.findMany({
        where: { tenantId: session.tenantId, category: 'DETAIL' },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, name: true, type: true },
    });
    return { success: true as const, data: accounts, message: '' };
}
