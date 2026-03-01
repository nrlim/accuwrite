'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
    BookOpen, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown,
    TrendingUp, TrendingDown, Minus, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getLedger } from '@/actions/journal.actions';

// =================== TYPES ===================

interface LedgerItem {
    id: string;
    debit: string | number;
    credit: string | number;
    memo: string | null;
    runningBalance: number;
    journalEntry: {
        id: string;
        date: string | Date;
        reference: string;
        description: string;
        sourceType: string;
    };
    contact: { name: string } | null;
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface GeneralLedgerProps {
    accounts: Account[];
    defaultAccountId?: string;
}

const fmt = (n: number | string) =>
    n === 0 || n === '0' ? '—' : `Rp ${Math.abs(Number(n)).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const sourceTypeLabel: Record<string, string> = {
    MANUAL: 'Jurnal', INVOICE: 'Invoice', PAYMENT: 'Pelunasan',
    BILL: 'Tagihan', BILL_PAYMENT: 'Bayar AP', CASH_IN: 'Kas Masuk',
    CASH_OUT: 'Kas Keluar', OPENING: 'Saldo Awal',
};

const typeColors: Record<string, string> = {
    ASSET: 'text-blue-600 dark:text-blue-400',
    LIABILITY: 'text-amber-600 dark:text-amber-400',
    EQUITY: 'text-purple-600 dark:text-purple-400',
    REVENUE: 'text-emerald-600 dark:text-emerald-400',
    EXPENSE: 'text-red-600 dark:text-red-400',
};

// =================== COMPONENT ===================

export function GeneralLedger({ accounts, defaultAccountId }: GeneralLedgerProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedId, setSelectedId] = useState(defaultAccountId ?? accounts[0]?.id ?? '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [ledgerData, setLedgerData] = useState<{
        account: any;
        items: LedgerItem[];
        openingBalance: number;
    } | null>(null);

    const selectedAccount = accounts.find((a) => a.id === selectedId);

    // ── Fetch ledger ──────────────────────────────────────────
    const fetchLedger = useCallback(() => {
        if (!selectedId) return;
        startTransition(async () => {
            const res = await getLedger(
                selectedId,
                startDate || undefined,
                endDate || undefined
            );
            if (res.success) {
                setLedgerData({
                    account: res.data.account,
                    items: res.data.items.map((item: any) => ({
                        ...item,
                        debit: Number(item.debit),
                        credit: Number(item.credit),
                        journalEntry: {
                            ...item.journalEntry,
                            date: new Date(item.journalEntry.date).toISOString(),
                        },
                    })),
                    openingBalance: res.data.openingBalance,
                });
            }
        });
    }, [selectedId, startDate, endDate]);

    // Filtered items
    const displayItems = ledgerData?.items.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.journalEntry.reference.toLowerCase().includes(q) ||
            item.journalEntry.description.toLowerCase().includes(q) ||
            item.memo?.toLowerCase().includes(q) ||
            item.contact?.name.toLowerCase().includes(q)
        );
    }) ?? [];

    // Totals
    const totalDebits = displayItems.reduce((s, i) => s + Number(i.debit), 0);
    const totalCredits = displayItems.reduce((s, i) => s + Number(i.credit), 0);
    const closingBalance = ledgerData ? ledgerData.items[ledgerData.items.length - 1]?.runningBalance ?? ledgerData.openingBalance : 0;

    // Group accounts by type for select
    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    const typeLabel: Record<string, string> = {
        ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Modal',
        REVENUE: 'Pendapatan', EXPENSE: 'Beban',
    };

    return (
        <div className="space-y-5">
            {/* Controls */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Account Select */}
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Pilih Akun</label>
                        <select
                            value={selectedId}
                            onChange={(e) => { setSelectedId(e.target.value); setLedgerData(null); }}
                            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {typeOrder.map((type) => {
                                const grouped = accounts.filter((a) => a.type === type);
                                return grouped.length > 0 ? (
                                    <optgroup key={type} label={typeLabel[type]}>
                                        {grouped.map((a) => (
                                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                        ))}
                                    </optgroup>
                                ) : null;
                            })}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Dari Tanggal</label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Sampai Tanggal</label>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Cari referensi, deskripsi, atau kontak..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                    <Button
                        onClick={fetchLedger}
                        disabled={!selectedId || isPending}
                        className="gap-2 shrink-0"
                    >
                        {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                        Tampilkan
                    </Button>
                </div>
            </div>

            {/* Account info bar */}
            {selectedAccount && ledgerData && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                    <div className={cn('text-sm font-bold', typeColors[selectedAccount.type])}>
                        {typeLabel[selectedAccount.type]}
                    </div>
                    <div>
                        <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selectedAccount.code}</span>
                        <span className="text-zinc-500 mx-2">·</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedAccount.name}</span>
                    </div>
                    <div className="ml-auto flex gap-6 text-xs">
                        <div className="text-right">
                            <p className="text-zinc-400">Saldo Awal</p>
                            <p className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                                {fmt(ledgerData.openingBalance)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-zinc-400">Total Debit</p>
                            <p className="font-mono font-semibold text-blue-600">{fmt(totalDebits)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-zinc-400">Total Kredit</p>
                            <p className="font-mono font-semibold text-amber-600">{fmt(totalCredits)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-zinc-400">Saldo Akhir</p>
                            <p className={cn('font-mono font-bold', closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                {fmt(closingBalance)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ledger Table */}
            {ledgerData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase w-28">Tanggal</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-400 uppercase w-32">Referensi</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-400 uppercase">Keterangan</th>
                                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase w-36">Debit</th>
                                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase w-36">Kredit</th>
                                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase w-40">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Opening balance row */}
                                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                                    <td className="px-4 py-2.5 text-xs text-zinc-400 italic" colSpan={3}>
                                        Saldo Awal
                                    </td>
                                    <td className="px-4 py-2.5" />
                                    <td className="px-4 py-2.5" />
                                    <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        {fmt(ledgerData.openingBalance)}
                                    </td>
                                </tr>

                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-zinc-400">
                                            Tidak ada transaksi pada filter yang dipilih
                                        </td>
                                    </tr>
                                ) : null}

                                {displayItems.map((item, idx) => {
                                    const isDebit = Number(item.debit) > 0;
                                    const balPositive = item.runningBalance >= 0;
                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.01 }}
                                            className="border-b border-zinc-50 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                                        >
                                            <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                                                {fmtDate(item.journalEntry.date)}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                                                    {item.journalEntry.reference}
                                                </span>
                                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                                    {sourceTypeLabel[item.journalEntry.sourceType] ?? item.journalEntry.sourceType}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-tight">
                                                    {item.memo || item.journalEntry.description}
                                                </p>
                                                {item.contact && (
                                                    <p className="text-xs text-zinc-400 mt-0.5">{item.contact.name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                {Number(item.debit) > 0 ? (
                                                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                        {fmt(item.debit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                {Number(item.credit) > 0 ? (
                                                    <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                        {fmt(item.credit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span className={cn(
                                                    'font-mono text-sm font-bold',
                                                    balPositive ? 'text-zinc-800 dark:text-zinc-200' : 'text-red-600 dark:text-red-400'
                                                )}>
                                                    {!balPositive && '('}
                                                    {fmt(item.runningBalance)}
                                                    {!balPositive && ')'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                            {/* Footer totals */}
                            {displayItems.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50">
                                        <td colSpan={3} className="px-4 py-3 font-semibold text-sm text-zinc-600 dark:text-zinc-400">
                                            Total ({displayItems.length} transaksi)
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                                            {fmt(totalDebits)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">
                                            {fmt(totalCredits)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                            {fmt(closingBalance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Empty state */}
            {!ledgerData && !isPending && (
                <div className="py-20 flex flex-col items-center text-center">
                    <BookOpen className="h-10 w-10 text-zinc-300 mb-4" />
                    <p className="text-zinc-500 font-medium">Pilih akun dan klik &quot;Tampilkan&quot;</p>
                    <p className="text-sm text-zinc-400 mt-1">Buku besar akan menampilkan semua transaksi akun tersebut</p>
                </div>
            )}
        </div>
    );
}
