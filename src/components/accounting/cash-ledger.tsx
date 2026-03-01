'use client';

import React, { useState, useTransition } from 'react';
import {
    ArrowDownCircle, ArrowUpCircle, CheckSquare, Square, RefreshCw,
    Trash2, BookOpen, SlidersHorizontal, CheckCheck, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toggleReconciliation, bulkReconcile, voidCashTransaction } from '@/actions/cash.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

export interface CashTx {
    id: string;
    date: string | Date;
    type: 'IN' | 'OUT';
    amount: string | number;
    description: string;
    reference: string | null;
    notes: string | null;
    reconciled: boolean;
    reconciledAt: string | Date | null;
    cashAccount: { id: string; code: string; name: string };
    counterAccount: { id: string; code: string; name: string; type: string };
    contact: { id: string; name: string } | null;
    journalEntry: { id: string; reference: string; status: string } | null;
}

interface CashLedgerProps {
    transactions: CashTx[];
    showReconcileColumn?: boolean;
    onRefresh: () => void;
}

// =================== HELPERS ===================

const fmt = (n: number | string) =>
    `Rp ${Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// =================== ROW ===================

function TransactionRow({
    tx,
    selected,
    onSelect,
    onToggleReconcile,
    onDelete,
    showReconcile,
}: {
    tx: CashTx;
    selected: boolean;
    onSelect: () => void;
    onToggleReconcile: (id: string, val: boolean) => void;
    onDelete: (id: string) => void;
    showReconcile: boolean;
}) {
    const isIN = tx.type === 'IN';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
                'grid gap-2 px-3 py-3 text-sm transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group',
                showReconcile
                    ? 'grid-cols-[24px_36px_100px_1fr_120px_100px_100px_28px]'
                    : 'grid-cols-[24px_36px_100px_1fr_120px_100px_28px]',
                tx.reconciled && 'opacity-60'
            )}
        >
            {/* Checkbox */}
            <button
                onClick={onSelect}
                className="flex items-center justify-center text-zinc-400 hover:text-brand-600"
            >
                {selected
                    ? <CheckSquare className="h-4 w-4 text-brand-600" />
                    : <Square className="h-4 w-4" />
                }
            </button>

            {/* Type badge */}
            <div className="flex items-center">
                {isIN
                    ? <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
                    : <ArrowUpCircle className="h-5 w-5 text-red-500" />
                }
            </div>

            {/* Date */}
            <span className="text-zinc-500 text-xs flex items-center">{fmtDate(tx.date)}</span>

            {/* Description */}
            <div className="flex flex-col justify-center min-w-0">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{tx.description}</span>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono">{tx.reference}</span>
                    <span>·</span>
                    <span>{tx.counterAccount.code} {tx.counterAccount.name}</span>
                    {tx.contact && <><span>·</span><span>{tx.contact.name}</span></>}
                </div>
            </div>

            {/* Amount */}
            <div className={cn(
                'flex items-center justify-end font-mono font-semibold text-sm',
                isIN ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}>
                {isIN ? '+' : '−'} {fmt(tx.amount)}
            </div>

            {/* Journal ref */}
            {tx.journalEntry && (
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span className="font-mono truncate">{tx.journalEntry.reference}</span>
                </div>
            )}

            {/* Reconcile toggle */}
            {showReconcile && (
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => onToggleReconcile(tx.id, !tx.reconciled)}
                        className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                            tx.reconciled
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 hover:bg-amber-100 hover:text-amber-700'
                        )}
                    >
                        {tx.reconciled
                            ? <><CheckCheck className="h-3 w-3" /> Sesuai</>
                            : <><Clock className="h-3 w-3" /> Belum</>
                        }
                    </button>
                </div>
            )}

            {/* Delete */}
            <div className="flex items-center justify-center">
                <button
                    onClick={() => onDelete(tx.id)}
                    disabled={tx.reconciled}
                    className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-all"
                    title={tx.reconciled ? 'Tidak bisa hapus — sudah direkonsiliasi' : 'Hapus transaksi'}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// =================== MAIN ===================

export function CashLedger({ transactions, showReconcileColumn = false, onRefresh }: CashLedgerProps) {
    const [pending, startTransition] = useTransition();
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleSelect = (id: string) =>
        setSelected((s) => {
            const n = new Set(s);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    const toggleAll = () => {
        if (selected.size === transactions.length) setSelected(new Set());
        else setSelected(new Set(transactions.map((t) => t.id)));
    };

    const handleToggleReconcile = (id: string, val: boolean) => {
        startTransition(async () => {
            const r = await toggleReconciliation(id, val);
            if (r.success) {
                showNotification(r.message, 'success');
                onRefresh();
            } else {
                showNotification(r.error, 'error');
            }
        });
    };

    const handleBulkReconcile = (val: boolean) => {
        if (!selected.size) return;
        startTransition(async () => {
            const r = await bulkReconcile([...selected], val);
            if (r.success) {
                showNotification(r.message, 'success');
                setSelected(new Set());
                onRefresh();
            } else {
                showNotification(r.error, 'error');
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Hapus transaksi ini? Jurnal terkait akan dibatalkan.')) return;
        startTransition(async () => {
            const r = await voidCashTransaction(id);
            if (r.success) {
                showNotification(r.message, 'success');
                setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
                onRefresh();
            } else {
                showNotification(r.error, 'error');
            }
        });
    };

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <ArrowDownCircle className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-400">Belum ada transaksi</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Bulk actions bar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
                    >
                        <span className="text-xs font-medium text-brand-700 dark:text-brand-400">
                            {selected.size} dipilih
                        </span>
                        <div className="flex gap-2 ml-auto">
                            {showReconcileColumn && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBulkReconcile(true)}
                                        disabled={pending}
                                        className="text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                                    >
                                        <CheckCheck className="h-3 w-3" /> Tandai Sesuai
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBulkReconcile(false)}
                                        disabled={pending}
                                        className="text-xs gap-1.5 text-zinc-600 hover:bg-zinc-50"
                                    >
                                        <Clock className="h-3 w-3" /> Batalkan Tandai
                                    </Button>
                                </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} className="text-xs">
                                Batal Pilih
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table header */}
            <div className={cn(
                'grid gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider',
                showReconcileColumn
                    ? 'grid-cols-[24px_36px_100px_1fr_120px_100px_100px_28px]'
                    : 'grid-cols-[24px_36px_100px_1fr_120px_100px_28px]'
            )}>
                <button onClick={toggleAll} className="text-zinc-400 hover:text-brand-600">
                    {selected.size === transactions.length && transactions.length > 0
                        ? <CheckSquare className="h-4 w-4 text-brand-600" />
                        : <Square className="h-4 w-4" />
                    }
                </button>
                <span></span>
                <span>Tanggal</span>
                <span>Keterangan</span>
                <span className="text-right">Nominal</span>
                <span>Jurnal</span>
                {showReconcileColumn && <span className="text-center">Status</span>}
                <span></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                <AnimatePresence>
                    {transactions.map((tx) => (
                        <TransactionRow
                            key={tx.id}
                            tx={tx}
                            selected={selected.has(tx.id)}
                            onSelect={() => toggleSelect(tx.id)}
                            onToggleReconcile={handleToggleReconcile}
                            onDelete={handleDelete}
                            showReconcile={showReconcileColumn}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
