'use client';

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Search, DollarSign, Briefcase, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COATree, type Account } from '@/components/accounting/coa-tree';
import { AccountFormModal } from '@/components/accounting/account-form-modal';
import { OpeningBalanceModal } from '@/components/accounting/opening-balance-modal';
import { getAccounts, seedTenantCoa } from '@/actions/account.actions';
import { showNotification } from '@/hooks/use-notification';

interface COAPageClientProps {
    initialAccounts: Account[];
    tenantId: string;
}

export function COAPageClient({ initialAccounts, tenantId }: COAPageClientProps) {
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

    // ── Template handler ──────────────────────────────────────
    const handleApplyTemplate = async (category: string) => {
        setIsRefreshing(true);
        const result = await seedTenantCoa(tenantId, category);
        if (result.success) {
            showNotification(result.message, 'success');
            await refresh();
        } else {
            showNotification(result.error, 'error');
        }
        setIsRefreshing(false);
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
                    {totalAccounts > 0 && (
                        <Button
                            onClick={() => handleAdd()}
                            size="sm"
                            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Akun
                        </Button>
                    )}
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

            {/* ── Empty State vs Content ── */}
            {totalAccounts === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-full mb-6 relative z-10 border border-brand-100 dark:border-brand-800">
                        <Plus className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 relative z-10">Bagan Akun Kosong</h2>
                    <p className="text-zinc-500 max-w-md mb-8 relative z-10">
                        Pilih template yang paling sesuai dengan jenis usaha Anda untuk setup instan, atau buat daftar akun dari awal secara manual.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl relative z-10 mb-8">
                        {/* Template Umum */}
                        <div
                            onClick={() => !isRefreshing && handleApplyTemplate('umum')}
                            className={`group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all cursor-pointer text-left
                                ${isRefreshing ? 'opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:border-brand-500 hover:shadow-md bg-white dark:bg-zinc-900 hover:bg-brand-50/50 dark:hover:bg-brand-900/10'}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Template Umum</h3>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Rekomendasi</span>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-500 flex-1">
                                Struktur standar untuk usaha jasa dan dagang umum. Termasuk Kas, Piutang, Hutang, Modal, dan Pendapatan Jasa.
                            </p>
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full flex justify-between items-center text-sm font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Gunakan Template</span>
                                <span>&rarr;</span>
                            </div>
                        </div>

                        {/* Template Logistik */}
                        <div
                            onClick={() => !isRefreshing && handleApplyTemplate('logistik')}
                            className={`group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all cursor-pointer text-left
                                ${isRefreshing ? 'opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-md bg-white dark:bg-zinc-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Template Logistik</h3>
                            </div>
                            <p className="text-sm text-zinc-500 flex-1">
                                Disesuaikan untuk bisnis ekspedisi dan kargo. Termasuk akun Beban Kendaraan, Gaji Kurir, dan Pendapatan Pengiriman.
                            </p>
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full flex justify-between items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Gunakan Template</span>
                                <span>&rarr;</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm text-zinc-500">
                        <span className="w-12 h-px bg-zinc-200 dark:bg-zinc-700"></span>
                        <span>Atau buat sendiri</span>
                        <span className="w-12 h-px bg-zinc-200 dark:bg-zinc-700"></span>
                    </div>

                    <Button
                        onClick={() => handleAdd()}
                        variant="ghost"
                        className="mt-4 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400"
                    >
                        Buat Akun Manual Secara Spesifik
                    </Button>

                </div>
            ) : (
                <>
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
                </>
            )}

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
        </div >
    );
}
