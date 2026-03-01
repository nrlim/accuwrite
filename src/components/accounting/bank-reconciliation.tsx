'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
    CheckCircle2, AlertCircle, RefreshCw, CheckCheck,
    ArrowDownCircle, ArrowUpCircle, Info, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bulkReconcile } from '@/actions/cash.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

interface CashTx {
    id: string;
    date: string | Date;
    type: 'IN' | 'OUT';
    amount: string | number;
    description: string;
    reference: string | null;
    reconciled: boolean;
}

interface Account {
    id: string; code: string; name: string;
    initialBalance: number | string;
}

interface BankReconciliationProps {
    cashAccount: Account;
    transactions: CashTx[];
    onRefresh: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// =================== COMPONENT ===================

export function BankReconciliation({ cashAccount, transactions, onRefresh }: BankReconciliationProps) {
    const [isPending, startTransition] = useTransition();
    const [statementBalance, setStatementBalance] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'UNRECONCILED' | 'RECONCILED'>('UNRECONCILED');
    const [checked, setChecked] = useState<Set<string>>(new Set());

    // ── Calculations ──────────────────────────────────────────
    const openingBalance = Number(cashAccount.initialBalance);

    const { totalIn, totalOut, currentBalance, reconciledIn, reconciledOut, reconciledBalance } = useMemo(() => {
        let totalIn = 0, totalOut = 0, reconciledIn = 0, reconciledOut = 0;
        for (const tx of transactions) {
            const amt = Number(tx.amount);
            if (tx.type === 'IN') { totalIn += amt; if (tx.reconciled) reconciledIn += amt; }
            else { totalOut += amt; if (tx.reconciled) reconciledOut += amt; }
        }
        return {
            totalIn, totalOut,
            currentBalance: openingBalance + totalIn - totalOut,
            reconciledIn, reconciledOut,
            reconciledBalance: openingBalance + reconciledIn - reconciledOut,
        };
    }, [transactions, openingBalance]);

    const statementAmt = parseFloat(statementBalance) || null;
    const difference = statementAmt !== null ? statementAmt - currentBalance : null;
    const isBalanced = difference !== null && Math.abs(difference) < 0.01;

    // ── Filtered list ─────────────────────────────────────────
    const filtered = useMemo(() => {
        if (filter === 'UNRECONCILED') return transactions.filter((t) => !t.reconciled);
        if (filter === 'RECONCILED') return transactions.filter((t) => t.reconciled);
        return transactions;
    }, [transactions, filter]);

    const unreconciledIds = transactions.filter((t) => !t.reconciled).map((t) => t.id);

    // ── Handlers ──────────────────────────────────────────────
    const toggleCheck = (id: string) =>
        setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const checkAll = () =>
        setChecked(checked.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.id)));

    const handleMarkChecked = (reconciled: boolean) => {
        const ids = [...checked];
        if (!ids.length) return;
        startTransition(async () => {
            const r = await bulkReconcile(ids, reconciled);
            if (r.success) {
                showNotification(r.message, 'success');
                setChecked(new Set());
                onRefresh();
            } else showNotification(r.error, 'error');
        });
    };

    const handleMarkAllUnreconciled = () => {
        startTransition(async () => {
            const r = await bulkReconcile(unreconciledIds, true);
            if (r.success) {
                showNotification(r.message, 'success');
                onRefresh();
            } else showNotification(r.error, 'error');
        });
    };

    return (
        <div className="space-y-5">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Saldo Buku', value: currentBalance, color: 'text-zinc-900 dark:text-zinc-100', bg: 'bg-zinc-50 dark:bg-zinc-800' },
                    { label: 'Total Masuk', value: totalIn, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Total Keluar', value: totalOut, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { label: 'Saldo Rekonsiliasi', value: reconciledBalance, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={cn('rounded-xl p-4', bg)}>
                        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                        <p className={cn('font-bold font-mono text-sm', color)}>{fmt(value)}</p>
                    </div>
                ))}
            </div>

            {/* ── Bank Statement Input & Balance Check ── */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Verifikasi Saldo Bank</h3>
                </div>

                <div className="flex items-end gap-4">
                    <div className="space-y-1.5 flex-1">
                        <Label className="text-xs font-medium">Saldo Menurut Rekening Koran / Mutasi Bank</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">Rp</span>
                            <Input
                                type="number"
                                value={statementBalance}
                                onChange={(e) => setStatementBalance(e.target.value)}
                                placeholder="Masukkan saldo akhir dari mutasi bank"
                                className="pl-10 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                {statementAmt !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'rounded-xl p-4 flex items-start gap-3',
                            isBalanced
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        )}
                    >
                        {isBalanced
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        }
                        <div className="text-sm">
                            <p className={cn('font-semibold', isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                                {isBalanced ? '✅ Saldo Sesuai!' : '⚠️ Terdapat Selisih'}
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-zinc-500">
                                <div>
                                    <p>Saldo Buku</p>
                                    <p className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{fmt(currentBalance)}</p>
                                </div>
                                <div>
                                    <p>Mutasi Bank</p>
                                    <p className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{fmt(statementAmt)}</p>
                                </div>
                                <div>
                                    <p>Selisih</p>
                                    <p className={cn('font-mono font-semibold', isBalanced ? 'text-emerald-600' : 'text-amber-600')}>
                                        {fmt(Math.abs(difference!))}
                                    </p>
                                </div>
                            </div>
                            {!isBalanced && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Tandai transaksi di bawah yang sesuai dengan mutasi bank untuk menemukan selisih.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Transaction Checklist ── */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold flex-1 text-zinc-900 dark:text-zinc-100">
                        Daftar Transaksi — Checklist Rekonsiliasi
                    </h3>
                    {/* Filter tabs */}
                    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                        {(['ALL', 'UNRECONCILED', 'RECONCILED'] as const).map((f) => {
                            const labels = { ALL: 'Semua', UNRECONCILED: 'Belum', RECONCILED: 'Sesuai' };
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        'px-3 py-1 rounded-md text-xs font-medium transition-all',
                                        filter === f
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                    )}
                                >
                                    {labels[f]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button
                        onClick={checkAll}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand-600 transition-colors"
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {checked.size === filtered.length && filtered.length > 0 ? 'Batal pilih' : 'Pilih semua'}
                        {checked.size > 0 && ` (${checked.size})`}
                    </button>
                    {checked.size > 0 && (
                        <>
                            <Button
                                size="sm"
                                onClick={() => handleMarkChecked(true)}
                                disabled={isPending}
                                className="ml-auto text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <CheckCircle2 className="h-3 w-3" /> Tandai Sesuai
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkChecked(false)}
                                disabled={isPending}
                                className="text-xs gap-1"
                            >
                                Batalkan
                            </Button>
                        </>
                    )}
                    {filter === 'UNRECONCILED' && unreconciledIds.length > 0 && checked.size === 0 && (
                        <Button
                            size="sm"
                            onClick={handleMarkAllUnreconciled}
                            disabled={isPending}
                            className="ml-auto text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                            Tandai Semua Sesuai ({unreconciledIds.length})
                        </Button>
                    )}
                </div>

                {/* Rows */}
                {filtered.length === 0 ? (
                    <div className="py-10 text-center text-sm text-zinc-400">
                        {filter === 'UNRECONCILED'
                            ? '🎉 Semua transaksi sudah direkonsiliasi!'
                            : 'Tidak ada transaksi'}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50 max-h-[60vh] overflow-y-auto">
                        {filtered.map((tx) => {
                            const isIN = tx.type === 'IN';
                            const isChecked = checked.has(tx.id);
                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => toggleCheck(tx.id)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                                        isChecked
                                            ? 'bg-brand-50 dark:bg-brand-900/20'
                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
                                        tx.reconciled && 'opacity-60',
                                    )}
                                >
                                    {/* Checkbox */}
                                    <div className={cn(
                                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                        isChecked
                                            ? 'bg-brand-600 border-brand-600'
                                            : tx.reconciled
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-zinc-300 dark:border-zinc-600'
                                    )}>
                                        {(isChecked || tx.reconciled) && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Icon */}
                                    {isIN
                                        ? <ArrowDownCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                        : <ArrowUpCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    }

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{tx.description}</p>
                                        <p className="text-xs text-zinc-400">
                                            {fmtDate(tx.date)}
                                            {tx.reference && <span className="ml-2 font-mono">{tx.reference}</span>}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <span className={cn(
                                        'font-mono font-semibold text-sm shrink-0',
                                        isIN ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    )}>
                                        {isIN ? '+' : '−'} {fmt(Number(tx.amount))}
                                    </span>

                                    {/* Status badge */}
                                    {tx.reconciled && (
                                        <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Sesuai
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Progress footer */}
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span>Progress Rekonsiliasi</span>
                        <span className="font-medium">
                            {transactions.filter((t) => t.reconciled).length} / {transactions.length} transaksi
                        </span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                                width: transactions.length > 0
                                    ? `${(transactions.filter((t) => t.reconciled).length / transactions.length) * 100}%`
                                    : '0%'
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
