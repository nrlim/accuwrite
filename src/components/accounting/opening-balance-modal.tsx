'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { X, DollarSign, RefreshCw, AlertCircle, Info, CheckCircle2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    setOpeningBalance,
    setBulkOpeningBalance,
} from '@/actions/opening-balance.actions';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';
import type { Account } from './coa-tree';

// =================== PROPS ===================

interface OpeningBalanceModalProps {
    isOpen: boolean;
    accounts: Account[];           // seluruh akun DETAIL
    preselectedAccount?: Account | null;
    onClose: () => void;
    onSuccess: () => void;
}

// =================== ACCOUNT TYPE CONFIG ===================

const typeInfo: Record<string, { label: string; color: string; bg: string; side: string }> = {
    ASSET: { label: 'Aset', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', side: 'Debit ↑' },
    EXPENSE: { label: 'Beban', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', side: 'Debit ↑' },
    LIABILITY: { label: 'Kewajiban', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', side: 'Kredit ↑' },
    EQUITY: { label: 'Modal', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', side: 'Kredit ↑' },
    REVENUE: { label: 'Pendapatan', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', side: 'Kredit ↑' },
};

// =================== SINGLE ACCOUNT TAB ===================

function SingleBalanceTab({
    accounts,
    preselectedAccount,
    date,
    setDate,
    onSuccess,
    onClose,
}: {
    accounts: Account[];
    preselectedAccount?: Account | null;
    date: string;
    setDate: (d: string) => void;
    onSuccess: () => void;
    onClose: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();
    const [selectedId, setSelectedId] = useState(preselectedAccount?.id ?? '');
    const [balance, setBalance] = useState('');
    const [description, setDescription] = useState('');

    const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;
    const selected = selectedAccount ? typeInfo[selectedAccount.type] : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !balance) return;
        startTransition(async () => {
            startLoading('Memposting saldo awal...');
            const result = await setOpeningBalance({
                accountId: selectedId,
                balance: parseFloat(balance),
                date,
                description,
            });
            stopLoading();
            if (result.success) {
                showNotification(result.message, 'success');
                onSuccess();
                onClose();
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Selector */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Akun *</Label>
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                >
                    <option value="">— Pilih Akun Detail —</option>
                    {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((type) => {
                        const filtered = accounts.filter((a) => a.type === type && a.category === 'DETAIL');
                        if (!filtered.length) return null;
                        return (
                            <optgroup key={type} label={typeInfo[type].label}>
                                {filtered.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.code} – {a.name}
                                        {Number(a.initialBalance) > 0 ? ` [✓ Rp ${Number(a.initialBalance).toLocaleString('id-ID')}]` : ''}
                                    </option>
                                ))}
                            </optgroup>
                        );
                    })}
                </select>
            </div>

            {/* Account Type Info Badge */}
            <AnimatePresence>
                {selected && selectedAccount && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn('rounded-xl p-3 flex items-start gap-3', selected.bg)}
                    >
                        <Info className={cn('h-4 w-4 mt-0.5 shrink-0', selected.color)} />
                        <div>
                            <p className={cn('text-xs font-semibold', selected.color)}>
                                {selected.label} — Saldo Normal: {selected.side}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Jurnal otomatis:&nbsp;
                                {['ASSET', 'EXPENSE'].includes(selectedAccount.type) ? (
                                    <>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">Debit</span>{' '}
                                        {selectedAccount.name} →{' '}
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Kredit</span>{' '}
                                        Modal Awal
                                    </>
                                ) : (
                                    <>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">Debit</span>{' '}
                                        Modal Awal →{' '}
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Kredit</span>{' '}
                                        {selectedAccount.name}
                                    </>
                                )}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Balance & Date */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Saldo Awal (Rp) *</Label>
                    <Input
                        type="number"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="font-mono text-sm"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tanggal *</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-sm"
                        required
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Deskripsi Jurnal (Opsional)</Label>
                <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Saldo awal Kas per 1 Januari 2025..."
                    className="text-sm"
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={isPending || !selectedId || !balance}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white gap-2"
                >
                    {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                    Posting Saldo Awal
                </Button>
            </div>
        </form>
    );
}

// =================== BULK BALANCE TAB ===================

interface BulkEntry {
    accountId: string;
    balance: string;
}

function BulkBalanceTab({
    accounts,
    date,
    setDate,
    onSuccess,
    onClose,
}: {
    accounts: Account[];
    date: string;
    setDate: (d: string) => void;
    onSuccess: () => void;
    onClose: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();

    // State: map accountId → balance string
    const [balances, setBalances] = useState<Record<string, string>>({});
    const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
        ASSET: true, LIABILITY: true, EQUITY: true, REVENUE: false, EXPENSE: false,
    });

    const detailAccounts = useMemo(
        () => accounts.filter((a) => a.category === 'DETAIL'),
        [accounts]
    );

    const setBalance = (id: string, val: string) =>
        setBalances((prev) => ({ ...prev, [id]: val }));

    // Calculate totals for the "balance check" display
    const totalDebit = detailAccounts
        .filter((a) => ['ASSET', 'EXPENSE'].includes(a.type))
        .reduce((s, a) => s + (parseFloat(balances[a.id] || '0') || 0), 0);

    const totalCredit = detailAccounts
        .filter((a) => ['LIABILITY', 'EQUITY', 'REVENUE'].includes(a.type))
        .reduce((s, a) => s + (parseFloat(balances[a.id] || '0') || 0), 0);

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    const filledCount = Object.values(balances).filter((v) => parseFloat(v) > 0).length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const entries = detailAccounts
            .filter((a) => parseFloat(balances[a.id] || '0') > 0)
            .map((a) => ({ accountId: a.id, balance: parseFloat(balances[a.id]) }));

        if (entries.length === 0) {
            showNotification('Isi minimal 1 saldo akun', 'error');
            return;
        }

        startTransition(async () => {
            startLoading(`Memposting ${entries.length} saldo awal...`);
            const result = await setBulkOpeningBalance({ date, entries });
            stopLoading();
            if (result.success) {
                showNotification(result.message, 'success');
                onSuccess();
                onClose();
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date + Summary */}
            <div className="flex items-end gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tanggal Neraca Awal *</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-sm w-48"
                        required
                    />
                </div>
                <div className="flex-1 flex items-center justify-end gap-4 pb-0.5 text-xs">
                    <span className="text-zinc-500">{filledCount} akun diisi</span>
                    <div className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium',
                        isBalanced ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    )}>
                        {isBalanced
                            ? <><CheckCircle2 className="h-3 w-3" /> Seimbang</>
                            : <><AlertCircle className="h-3 w-3" /> Selisih: Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}</>
                        }
                    </div>
                </div>
            </div>

            {/* Account List per Type */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden max-h-[50vh] overflow-y-auto">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_180px] bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                    <div className="px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Akun</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Saldo Awal (Rp)</div>
                </div>

                {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((type) => {
                    const typeAccounts = detailAccounts.filter((a) => a.type === type);
                    if (!typeAccounts.length) return null;
                    const cfg = typeInfo[type];
                    const expanded = expandedTypes[type];
                    const typeTotal = typeAccounts.reduce((s, a) => s + (parseFloat(balances[a.id] || '0') || 0), 0);

                    return (
                        <div key={type}>
                            {/* Type Header */}
                            <button
                                type="button"
                                onClick={() => setExpandedTypes((p) => ({ ...p, [type]: !p[type] }))}
                                className={cn(
                                    'w-full grid grid-cols-[1fr_180px] border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5 items-center text-left',
                                    cfg.bg, 'hover:brightness-95 transition-all'
                                )}
                            >
                                <span className={cn('text-xs font-bold flex items-center gap-2', cfg.color)}>
                                    {expanded
                                        ? <ChevronDown className="h-3 w-3" />
                                        : <ChevronRight className="h-3 w-3" />
                                    }
                                    {cfg.label}&nbsp;
                                    <span className="font-normal text-zinc-400">({cfg.side})</span>
                                </span>
                                <span className={cn('text-xs font-mono text-right', typeTotal > 0 ? cfg.color : 'text-zinc-400')}>
                                    {typeTotal > 0 ? `Rp ${typeTotal.toLocaleString('id-ID')}` : '—'}
                                </span>
                            </button>

                            {/* Accounts */}
                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {typeAccounts.map((acct, idx) => {
                                            const hasExistingBalance = Number(acct.initialBalance) > 0;
                                            return (
                                                <div
                                                    key={acct.id}
                                                    className={cn(
                                                        'grid grid-cols-[1fr_180px] items-center border-b border-zinc-50 dark:border-zinc-800/60',
                                                        'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors',
                                                        parseFloat(balances[acct.id] || '0') > 0 && 'bg-brand-50/40 dark:bg-brand-900/10'
                                                    )}
                                                >
                                                    <div className="px-4 py-2.5 flex items-center gap-2 min-w-0">
                                                        <span className={cn(
                                                            'text-xs font-mono px-1.5 py-0.5 rounded shrink-0 font-medium',
                                                            cfg.color, cfg.bg
                                                        )}>
                                                            {acct.code}
                                                        </span>
                                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                                            {acct.name}
                                                        </span>
                                                        {hasExistingBalance && (
                                                            <span title="Sudah ada saldo awal">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={balances[acct.id] ?? ''}
                                                            onChange={(e) => setBalance(acct.id, e.target.value)}
                                                            placeholder={hasExistingBalance
                                                                ? Number(acct.initialBalance).toLocaleString('id-ID')
                                                                : '0'
                                                            }
                                                            min="0"
                                                            step="0.01"
                                                            className="h-8 text-right text-sm font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <p className="text-xs text-blue-500 mb-1">Total Debit (Aset + Beban)</p>
                    <p className="font-bold font-mono text-blue-700 dark:text-blue-400">
                        Rp {totalDebit.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                    <p className="text-xs text-emerald-500 mb-1">Total Kredit (Liabilitas + Modal)</p>
                    <p className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        Rp {totalCredit.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className={cn(
                    'rounded-lg p-3 text-center',
                    isBalanced ? 'bg-zinc-50 dark:bg-zinc-800' : 'bg-amber-50 dark:bg-amber-900/20'
                )}>
                    <p className="text-xs text-zinc-500 mb-1">Selisih</p>
                    <p className={cn(
                        'font-bold font-mono',
                        isBalanced ? 'text-zinc-500' : 'text-amber-700 dark:text-amber-400'
                    )}>
                        Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {!isBalanced && filledCount > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                        Neraca tidak seimbang. Selisih Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')} akan
                        otomatis di-offset ke akun <strong>Modal Awal (Opening Balance Equity)</strong>.
                    </span>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={isPending || filledCount === 0}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white gap-2"
                >
                    {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                    Posting {filledCount > 0 ? `${filledCount} ` : ''}Saldo Awal
                </Button>
            </div>
        </form>
    );
}

// =================== MAIN MODAL ===================

export function OpeningBalanceModal({
    isOpen,
    accounts,
    preselectedAccount,
    onClose,
    onSuccess,
}: OpeningBalanceModalProps) {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>(
        preselectedAccount ? 'single' : 'bulk'
    );
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Default ke 1 bulan ini
        return d.toISOString().split('T')[0];
    });

    const detailAccounts = accounts.filter((a) => a.category === 'DETAIL');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.93, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-zinc-200 dark:border-zinc-700"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/30">
                                    <DollarSign className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Set Opening Balance</h3>
                                    <p className="text-xs text-zinc-500">
                                        Posting saldo awal → Journal Entry otomatis
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
                            {([
                                { key: 'single', label: '1 Akun' },
                                { key: 'bulk', label: 'Semua Akun (Bulk)' },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                                        activeTab === tab.key
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto flex-1">
                            <AnimatePresence mode="wait">
                                {activeTab === 'single' ? (
                                    <motion.div
                                        key="single"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <SingleBalanceTab
                                            accounts={detailAccounts}
                                            preselectedAccount={preselectedAccount}
                                            date={date}
                                            setDate={setDate}
                                            onSuccess={onSuccess}
                                            onClose={onClose}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="bulk"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <BulkBalanceTab
                                            accounts={detailAccounts}
                                            date={date}
                                            setDate={setDate}
                                            onSuccess={onSuccess}
                                            onClose={onClose}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
