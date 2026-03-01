'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BalanceSheet, AccountLine } from '@/actions/reports.actions';

// =================== HELPERS ===================

const fmt = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// =================== SECTION TABLE ===================

function SectionTable({
    title,
    accounts,
    total,
    color,
    specialRow,
}: {
    title: string;
    accounts: AccountLine[];
    total: number;
    color: string;
    specialRow?: { label: string; amount: number; subtitle?: string };
}) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className={cn('px-5 py-3 border-b border-zinc-200 dark:border-zinc-700', color)}>
                <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-left px-5 py-2 text-xs font-semibold text-zinc-400 uppercase">Kode</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-400 uppercase">Nama Akun</th>
                        <th className="text-right px-5 py-2 text-xs font-semibold text-zinc-400 uppercase">Saldo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {accounts.length === 0 && !specialRow && (
                        <tr>
                            <td colSpan={3} className="px-5 py-4 text-center text-xs text-zinc-400">Tidak ada akun</td>
                        </tr>
                    )}
                    {accounts.map((acc, i) => (
                        <motion.tr
                            key={acc.id}
                            initial={{ opacity: 0, x: -6 }}
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

                    {/* Special row (e.g. Net Income inside Equity) */}
                    {specialRow && (
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                            <td className="px-5 py-2.5 font-mono text-xs text-blue-400 italic">—</td>
                            <td className="px-3 py-2.5 text-blue-700 dark:text-blue-400 italic">
                                {specialRow.label}
                                {specialRow.subtitle && (
                                    <span className="text-xs text-zinc-400 ml-1">({specialRow.subtitle})</span>
                                )}
                            </td>
                            <td className={cn(
                                'px-5 py-2.5 text-right font-mono font-medium italic',
                                specialRow.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            )}>
                                {specialRow.amount >= 0 ? '' : '(−) '}
                                {fmt(specialRow.amount)}
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50">
                        <td colSpan={2} className="px-5 py-3 font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                            Total {title.split(' ')[0]}
                        </td>
                        <td className="px-5 py-3 text-right font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {fmt(total)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// =================== MAIN ===================

export function BalanceSheetView({ bs }: { bs: BalanceSheet }) {
    const {
        asOfDate, assets, liabilities, equity,
        totalAssets, totalLiabilities, totalEquity,
        netIncome, isBalanced, difference,
    } = bs;

    const totalRightSide = totalLiabilities + totalEquity + netIncome;

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Header */}
            <div className="rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white">
                <p className="text-xs text-blue-300 uppercase tracking-widest mb-1">Neraca Keuangan</p>
                <h2 className="font-bold text-lg">Per {fmtDate(asOfDate)}</h2>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <p className="text-xs text-blue-300">Total Aset</p>
                        <p className="font-mono font-bold text-white">{fmt(totalAssets)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-300">Total Kewajiban</p>
                        <p className="font-mono font-bold text-amber-300">{fmt(totalLiabilities)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-300">Ekuitas + Laba</p>
                        <p className="font-mono font-bold text-emerald-300">{fmt(totalEquity + netIncome)}</p>
                    </div>
                </div>
            </div>

            {/* Balance check badge */}
            <div className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
                isBalanced
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
            )}>
                {isBalanced
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                }
                <Scale className="h-4 w-4 shrink-0" />
                <span>
                    {isBalanced
                        ? '✅ Neraca seimbang — Aset = Kewajiban + Ekuitas'
                        : `⚠️ Neraca belum seimbang — selisih Rp ${difference.toLocaleString('id-ID')}`
                    }
                </span>
                {!isBalanced && (
                    <span className="ml-auto text-xs">
                        Kiri: {fmt(totalAssets)} | Kanan: {fmt(totalRightSide)}
                    </span>
                )}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Assets */}
                <SectionTable
                    title="Aset (Assets)"
                    accounts={assets}
                    total={totalAssets}
                    color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                />

                {/* Right: Liabilities + Equity stacked */}
                <div className="space-y-4">
                    <SectionTable
                        title="Kewajiban (Liabilities)"
                        accounts={liabilities}
                        total={totalLiabilities}
                        color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    />
                    <SectionTable
                        title="Ekuitas (Equity)"
                        accounts={equity}
                        total={totalEquity + netIncome}
                        color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        specialRow={{
                            label: netIncome >= 0 ? 'Laba Periode Berjalan' : 'Rugi Periode Berjalan',
                            amount: netIncome,
                            subtitle: 'dari P&L tahun berjalan',
                        }}
                    />
                </div>
            </div>

            {/* Equation confirmation */}
            <div className="rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Verifikasi Persamaan Akuntansi: Aset = Kewajiban + Ekuitas
                </p>
                <div className="flex items-center gap-4 text-sm font-mono">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{fmt(totalAssets)}</span>
                    <span className="text-zinc-400">=</span>
                    <span className="text-amber-600 dark:text-amber-400">{fmt(totalLiabilities)}</span>
                    <span className="text-zinc-400">+</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{fmt(totalEquity)}</span>
                    <span className="text-zinc-400">+</span>
                    <span className={cn('font-bold', netIncome >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {fmt(netIncome)}
                    </span>
                    {isBalanced
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-2" />
                        : <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />
                    }
                </div>
            </div>
        </div>
    );
}
