'use client';

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Search, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COATree, type Account } from '@/components/accounting/coa-tree';
import { AccountFormModal } from '@/components/accounting/account-form-modal';
import { OpeningBalanceModal } from '@/components/accounting/opening-balance-modal';
import { getAccounts } from '@/actions/account.actions';

interface COAPageClientProps {
    initialAccounts: Account[];
}

export function COAPageClient({ initialAccounts }: COAPageClientProps) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Account form modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

    // Opening balance modal state
    const [isOBOpen, setIsOBOpen] = useState(false);
    const [obPreselected, setObPreselected] = useState<Account | null>(null);

    // ── Refresh ──────────────────────────────────────────────
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const result = await getAccounts();
        if (result.success) setAccounts(result.data as any);
        setIsRefreshing(false);
    }, []);

    // ── Form handlers ─────────────────────────────────────────
    const handleAdd = (parentId?: string) => {
        setFormMode('create');
        setEditingAccount(null);
        setDefaultParentId(parentId || null);
        setIsFormOpen(true);
    };

    const handleEdit = (account: Account) => {
        setFormMode('edit');
        setEditingAccount(account);
        setDefaultParentId(null);
        setIsFormOpen(true);
    };

    // ── Opening Balance handler ───────────────────────────────
    const handleSetBalance = (account: Account) => {
        setObPreselected(account);
        setIsOBOpen(true);
    };

    const handleOpenBulkBalance = () => {
        setObPreselected(null);
        setIsOBOpen(true);
    };

    // ── Search / Stats ────────────────────────────────────────
    const filteredAccounts = search
        ? accounts.filter(
            (a) =>
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.code.toLowerCase().includes(search.toLowerCase())
        )
        : accounts;

    const totalAccounts = accounts.length;
    const headerCount = accounts.filter((a) => a.category === 'HEADER').length;
    const detailCount = accounts.filter((a) => a.category === 'DETAIL').length;
    const withBalance = accounts.filter(
        (a) => a.category === 'DETAIL' && Number(a.initialBalance) > 0
    ).length;
    const totalBalance = accounts
        .filter((a) => a.category === 'DETAIL')
        .reduce((s, a) => s + Number(a.initialBalance), 0);

    const typeStats = (['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map(
        (type) => ({
            type,
            count: accounts.filter((a) => a.type === type).length,
            label: { ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Modal', REVENUE: 'Pendapatan', EXPENSE: 'Beban' }[type],
            color: {
                ASSET: 'text-blue-600 dark:text-blue-400',
                LIABILITY: 'text-red-600 dark:text-red-400',
                EQUITY: 'text-purple-600 dark:text-purple-400',
                REVENUE: 'text-emerald-600 dark:text-emerald-400',
                EXPENSE: 'text-orange-600 dark:text-orange-400',
            }[type] as string,
        })
    );

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Manajemen Akun
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Chart of Accounts · {totalAccounts} akun ({headerCount} header, {detailCount} detail)
                        {withBalance > 0 && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                · {withBalance} saldo awal tersimpan
                            </span>
                        )}
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
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenBulkBalance}
                        className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                        <DollarSign className="h-4 w-4" />
                        Set Opening Balance
                    </Button>
                    <Button
                        onClick={() => handleAdd()}
                        size="sm"
                        className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Akun
                    </Button>
                </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {typeStats.map(({ type, count, label, color }) => (
                    <div
                        key={type}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-center"
                    >
                        <p className={`text-xl font-bold ${color}`}>{count}</p>
                        <p className="text-xs text-zinc-500">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Opening Balance Progress Banner ── */}
            {detailCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Saldo Awal Tersimpan
                            </span>
                            <span className="text-xs text-zinc-500 shrink-0">
                                {withBalance}/{detailCount} akun detail
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(withBalance / detailCount) * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            Rp {totalBalance.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-zinc-500">Total saldo</p>
                    </div>
                    {withBalance < detailCount && (
                        <Button
                            size="sm"
                            onClick={handleOpenBulkBalance}
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        >
                            <DollarSign className="h-3 w-3" />
                            Isi Saldo
                        </Button>
                    )}
                </motion.div>
            )}

            {/* ── Search ── */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Cari akun berdasarkan kode atau nama..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-sm"
                />
            </div>

            {/* ── COA Tree ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
            >
                <COATree
                    accounts={filteredAccounts}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onSetBalance={handleSetBalance}
                    onRefresh={refresh}
                />
            </motion.div>

            {/* ── Account Form Modal ── */}
            <AccountFormModal
                isOpen={isFormOpen}
                mode={formMode}
                account={editingAccount}
                parentId={defaultParentId}
                allAccounts={accounts}
                onClose={() => setIsFormOpen(false)}
                onSuccess={refresh}
            />

            {/* ── Opening Balance Modal ── */}
            <OpeningBalanceModal
                isOpen={isOBOpen}
                accounts={accounts}
                preselectedAccount={obPreselected}
                onClose={() => setIsOBOpen(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
