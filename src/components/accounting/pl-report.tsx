'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PLReport, AccountLine } from '@/actions/reports.actions';

// =================== HELPERS ===================

const fmt = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// =================== ACCOUNT TABLE ===================

function AccountTable({
    title,
    accounts,
    total,
    totalLabel,
    accentColor,
    emptyMsg,
}: {
    title: string;
    accounts: AccountLine[];
    total: number;
    totalLabel: string;
    accentColor: string;
    emptyMsg: string;
}) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Section header */}
            <div className={cn('px-5 py-3 border-b border-zinc-200 dark:border-zinc-700', accentColor)}>
                <h3 className="font-semibold text-sm">{title}</h3>
            </div>

            {accounts.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-zinc-400">{emptyMsg}</div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            <th className="text-left px-5 py-2 text-xs font-semibold text-zinc-400 uppercase">Kode</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-400 uppercase">Nama Akun</th>
                            <th className="text-right px-5 py-2 text-xs font-semibold text-zinc-400 uppercase">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                        {accounts.map((acc, i) => (
                            <motion.tr
                                key={acc.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className={cn(
                                    'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors',
                                    acc.balance === 0 && 'opacity-40'
                                )}
                            >
                                <td className="px-5 py-2.5 font-mono text-xs text-zinc-400">{acc.code}</td>
                                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">{acc.name}</td>
                                <td className="px-5 py-2.5 text-right font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                    {fmt(acc.balance)}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                    {/* Total row */}
                    <tfoot>
                        <tr className="border-t-2 border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50">
                            <td colSpan={2} className="px-5 py-3 font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                                {totalLabel}
                            </td>
                            <td className="px-5 py-3 text-right font-bold font-mono text-zinc-900 dark:text-zinc-100">
                                {fmt(total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            )}
        </div>
    );
}

// =================== MAIN P&L COMPONENT ===================

export function PLReportView({ report }: { report: PLReport }) {
    const { period, revenue, expenses, totalRevenue, totalExpenses, netIncome, isProfit } = report;

    const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Period Header */}
            <div className="rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-800 dark:to-zinc-900 p-5 text-white">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Laporan Laba Rugi</p>
                <h2 className="font-bold text-lg">
                    {fmtDate(period.startDate)} — {fmtDate(period.endDate)}
                </h2>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <p className="text-xs text-zinc-400">Total Pendapatan</p>
                        <p className="font-mono font-bold text-emerald-400">{fmt(totalRevenue)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-400">Total Beban</p>
                        <p className="font-mono font-bold text-red-400">{fmt(totalExpenses)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-400">Margin</p>
                        <p className={cn('font-mono font-bold', isProfit ? 'text-emerald-400' : 'text-red-400')}>
                            {margin.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Revenue */}
            <AccountTable
                title="Pendapatan (Revenue)"
                accounts={revenue}
                total={totalRevenue}
                totalLabel="Total Pendapatan"
                accentColor="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                emptyMsg="Tidak ada akun pendapatan yang aktif pada periode ini"
            />

            {/* Expenses */}
            <AccountTable
                title="Beban (Expenses)"
                accounts={expenses}
                total={totalExpenses}
                totalLabel="Total Beban"
                accentColor="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                emptyMsg="Tidak ada akun beban yang aktif pada periode ini"
            />

            {/* Net Income */}
            <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                    'rounded-xl p-5 border-2',
                    isProfit
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isProfit
                            ? <TrendingUp className="h-6 w-6 text-emerald-500" />
                            : <TrendingDown className="h-6 w-6 text-red-500" />
                        }
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                {isProfit ? '✅ Laba Bersih' : '❌ Rugi Bersih'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {isProfit
                                    ? 'Pendapatan melebihi beban pada periode ini'
                                    : 'Beban melebihi pendapatan pada periode ini'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={cn(
                            'font-bold font-mono text-2xl',
                            isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>
                            {fmt(netIncome)}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
