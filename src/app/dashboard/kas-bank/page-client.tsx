'use client';

import React, { useState, useCallback, useTransition } from 'react';
import {
    Plus, RefreshCw, Landmark, ArrowDownCircle, ArrowUpCircle,
    SlidersHorizontal, CheckCheck, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CashTransactionForm } from '@/components/accounting/cash-transaction-form';
import { CashLedger, type CashTx } from '@/components/accounting/cash-ledger';
import { BankReconciliation } from '@/components/accounting/bank-reconciliation';
import { getCashTransactions, getCashBalance } from '@/actions/cash.actions';

// =================== TYPES ===================

interface Account {
    id: string; code: string; name: string;
    type: string; category: string;
    initialBalance?: string | number;
}

interface KasBankPageClientProps {
    initialCashAccounts: Account[];
    initialAllAccounts: Account[];
    initialTransactions: CashTx[];
    contacts: { id: string; name: string }[];
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

// =================== COMPONENT ===================

export function KasBankPageClient({
    initialCashAccounts,
    initialAllAccounts,
    initialTransactions,
    contacts,
}: KasBankPageClientProps) {
    const [activeTab, setActiveTab] = useState<'TRANSAKSI' | 'REKONSILIASI'>('TRANSAKSI');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [defaultFormType, setDefaultFormType] = useState<'IN' | 'OUT'>('IN');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Account selection for filtering
    const [selectedCashAccountId, setSelectedCashAccountId] = useState<string>(
        initialCashAccounts[0]?.id ?? ''
    );

    const [transactions, setTransactions] = useState<CashTx[]>(initialTransactions);
    const [cashBalance, setCashBalance] = useState<{
        openingBalance: number; totalIn: number; totalOut: number; currentBalance: number;
    } | null>(null);

    // ── Refresh ───────────────────────────────────────────────
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const [txRes, balRes] = await Promise.all([
            getCashTransactions(selectedCashAccountId || undefined, 1, 100),
            selectedCashAccountId
                ? getCashBalance(selectedCashAccountId)
                : Promise.resolve(null),
        ]);
        if (txRes.success) setTransactions(txRes.data.transactions as any);
        if (balRes?.success) setCashBalance(balRes.data);
        setIsRefreshing(false);
    }, [selectedCashAccountId]);

    // ── When account changes, reload ──────────────────────────
    const handleAccountChange = useCallback(async (id: string) => {
        setSelectedCashAccountId(id);
        setIsRefreshing(true);
        const [txRes, balRes] = await Promise.all([
            getCashTransactions(id || undefined, 1, 100),
            id ? getCashBalance(id) : Promise.resolve(null),
        ]);
        if (txRes.success) setTransactions(txRes.data.transactions as any);
        if (balRes?.success) setCashBalance(balRes.data);
        setIsRefreshing(false);
    }, []);

    // ── Filtered transactions ─────────────────────────────────
    const filtered = transactions.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            t.description.toLowerCase().includes(q) ||
            (t.reference?.toLowerCase().includes(q)) ||
            (t.contact?.name?.toLowerCase().includes(q)) ||
            t.counterAccount.name.toLowerCase().includes(q)
        );
    });

    // ── Quick stats ───────────────────────────────────────────
    const totalIn = transactions.filter((t) => t.type === 'IN').reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = transactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
    const selectedAccount = initialCashAccounts.find((a) => a.id === selectedCashAccountId) ?? null;
    const openingBal = Number(selectedAccount?.initialBalance ?? 0);
    const computedBalance = openingBal + totalIn - totalOut;
    const unreconciledCount = transactions.filter((t) => !t.reconciled).length;

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-brand-600" />
                        Kas & Bank
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Pencatatan transaksi & rekonsiliasi bank
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDefaultFormType('OUT'); setIsFormOpen(true); }}
                        className="gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    >
                        <ArrowUpCircle className="h-4 w-4" />
                        Uang Keluar
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => { setDefaultFormType('IN'); setIsFormOpen(true); }}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <ArrowDownCircle className="h-4 w-4" />
                        Uang Masuk
                    </Button>
                </div>
            </div>

            {/* ── Account Selector + Balance Summary ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Account Selector */}
                <div className="md:col-span-1">
                    <label className="text-xs font-medium text-zinc-500 block mb-1.5">Akun Kas / Bank</label>
                    <select
                        value={selectedCashAccountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    >
                        <option value="">— Semua Akun —</option>
                        {initialCashAccounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                        ))}
                    </select>
                </div>

                {/* Balance Cards */}
                {[
                    { label: 'Saldo Awal', value: openingBal, color: 'text-zinc-700 dark:text-zinc-300', bg: 'bg-zinc-50 dark:bg-zinc-800' },
                    { label: 'Total Masuk', value: totalIn, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: '↓' },
                    { label: 'Total Keluar', value: totalOut, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: '↑' },
                    { label: 'Saldo Saat Ini', value: computedBalance, color: computedBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map(({ label, value, color, bg, icon }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('rounded-xl p-4', bg)}
                    >
                        <p className="text-xs text-zinc-500 mb-1">{label}</p>
                        <p className={cn('font-bold font-mono text-lg', color)}>
                            {icon && <span className="mr-0.5 text-sm">{icon}</span>}
                            {fmt(value)}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
                {([
                    { key: 'TRANSAKSI' as const, label: 'Transaksi', count: transactions.length, countClass: undefined as string | undefined },
                    {
                        key: 'REKONSILIASI' as const,
                        label: 'Rekonsiliasi Bank',
                        count: unreconciledCount,
                        countClass: unreconciledCount > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : undefined as string | undefined,
                    },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === tab.key
                                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                            tab.countClass ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'TRANSAKSI' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Cari transaksi, referensi, atau nama kontak..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                        <CashLedger
                            transactions={filtered}
                            showReconcileColumn={true}
                            onRefresh={refresh}
                        />
                    </div>
                </motion.div>
            )}

            {activeTab === 'REKONSILIASI' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {selectedCashAccountId ? (
                        <BankReconciliation
                            cashAccount={{
                                id: selectedAccount!.id,
                                code: selectedAccount!.code,
                                name: selectedAccount!.name,
                                initialBalance: Number(selectedAccount!.initialBalance ?? 0),
                            }}
                            transactions={transactions}
                            onRefresh={refresh}
                        />
                    ) : (
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
                            <Landmark className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">
                                Pilih satu akun Kas/Bank untuk memulai rekonsiliasi
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Transaction Form Modal ── */}
            <CashTransactionForm
                isOpen={isFormOpen}
                defaultType={defaultFormType}
                cashAccounts={initialCashAccounts}
                allAccounts={initialAllAccounts}
                contacts={contacts}
                defaultCashAccountId={selectedCashAccountId || undefined}
                onClose={() => setIsFormOpen(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
