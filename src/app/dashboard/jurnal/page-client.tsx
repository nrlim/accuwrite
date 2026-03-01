'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Clock, CheckCircle2, Ban, RefreshCw, ChevronRight, Book, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JournalForm } from '@/components/accounting/journal-form';
import { getJournalEntries, voidJournalEntry } from '@/actions/journal.actions';
import { showNotification } from '@/hooks/use-notification';
import { cn } from '@/lib/utils';

interface Account { id: string; code: string; name: string; type: string; }
interface Contact { id: string; name: string; }

interface JournalItem {
    id: string;
    debit: number | string;
    credit: number | string;
    memo?: string | null;
    account: { code: string; name: string; type: string };
    contact?: { name: string } | null;
}

interface JournalEntry {
    id: string;
    date: string | Date;
    reference: string;
    description: string;
    status: 'DRAFT' | 'POSTED' | 'VOID';
    sourceType?: string | null;
    items: JournalItem[];
}

interface JournalPageClientProps {
    initialEntries: JournalEntry[];
    accounts: Account[];
    contacts: Contact[];
}

const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-zinc-100 text-zinc-500', icon: FileText },
    POSTED: { label: 'Posted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
    VOID: { label: 'Void', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: Ban },
};

const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const fmt = (n: number | string) =>
    `Rp ${Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

function JournalEntryRow({ entry, onVoid }: { entry: JournalEntry; onVoid: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false);
    const sc = statusConfig[entry.status];
    const StatusIcon = sc.icon;
    const totalDebit = entry.items.reduce((s, i) => s + Number(i.debit), 0);
    const isAutoJournal = entry.sourceType === 'INVOICE' || entry.sourceType === 'PAYMENT';

    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{entry.reference}</span>
                        <span className={cn('flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium', sc.color)}>
                            <StatusIcon className="h-2.5 w-2.5" />{sc.label}
                        </span>
                        {isAutoJournal && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                                ✦ Auto
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{entry.description}</p>
                </div>
                <div className="text-right hidden md:block shrink-0">
                    <p className="text-xs text-zinc-400">{fmtDate(entry.date)}</p>
                    <p className="text-sm font-semibold font-mono text-zinc-800 dark:text-zinc-200">{fmt(totalDebit)}</p>
                </div>
                {entry.status === 'POSTED' && !isAutoJournal && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onVoid(entry.id); }}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 shrink-0"
                    >
                        Batalkan
                    </Button>
                )}
                <ChevronRight className={cn('h-4 w-4 text-zinc-400 transition-transform shrink-0', expanded && 'rotate-90')} />
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <th className="text-left px-4 py-2 text-zinc-500 font-semibold uppercase">Akun</th>
                                    <th className="text-left px-4 py-2 text-zinc-500 font-semibold uppercase">Memo</th>
                                    <th className="text-right px-4 py-2 text-zinc-500 font-semibold uppercase">Debit</th>
                                    <th className="text-right px-4 py-2 text-zinc-500 font-semibold uppercase">Kredit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {entry.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                        <td className="px-4 py-2.5">
                                            <span className="font-mono text-xs font-medium text-zinc-500 mr-2">{item.account.code}</span>
                                            <span>{item.account.name}</span>
                                            {item.contact && <span className="text-zinc-400 ml-1">· {item.contact.name}</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-zinc-500">{item.memo || '-'}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                                            {Number(item.debit) > 0 ? fmt(item.debit) : '-'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                            {Number(item.credit) > 0 ? fmt(item.credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 font-bold">
                                    <td colSpan={2} className="px-4 py-2 text-xs text-zinc-500 uppercase">Total</td>
                                    <td className="px-4 py-2 text-right font-mono text-blue-700 dark:text-blue-300">
                                        {fmt(entry.items.reduce((s, i) => s + Number(i.debit), 0))}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-300">
                                        {fmt(entry.items.reduce((s, i) => s + Number(i.credit), 0))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function JournalPageClient({ initialEntries, accounts, contacts }: JournalPageClientProps) {
    const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
    const [showForm, setShowForm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const result = await getJournalEntries(1, 50);
        if (result.success) setEntries(result.data.entries as any);
        setIsRefreshing(false);
    }, []);

    const handleVoid = async (id: string) => {
        const result = await voidJournalEntry(id);
        if (result.success) {
            showNotification(result.message, 'success');
            refresh();
        } else {
            showNotification(result.error, 'error');
        }
    };

    const totalPosted = entries.filter((e) => e.status === 'POSTED').length;
    const totalDebitPosted = entries
        .filter((e) => e.status === 'POSTED')
        .reduce((s, e) => s + e.items.reduce((ss, i) => ss + Number(i.debit), 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Jurnal Umum</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {totalPosted} entri terjurnal · Total: Rp {totalDebitPosted.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing} className="gap-2">
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1 w-fit">
                {[
                    { key: 'list', label: 'Daftar Jurnal', icon: BookOpen },
                    { key: 'new', label: 'Jurnal Baru', icon: Plus },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === tab.key
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'new' ? (
                    <motion.div
                        key="new"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6"
                    >
                        <div className="mb-5">
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Entri Jurnal Manual</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Double-entry bookkeeping · Total debit harus sama dengan total kredit</p>
                        </div>
                        <JournalForm
                            accounts={accounts}
                            contacts={contacts}
                            onSuccess={() => { refresh(); setActiveTab('list'); }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="space-y-3"
                    >
                        {entries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                <BookOpen className="h-8 w-8 text-zinc-300 mb-3" />
                                <p className="text-zinc-400 text-sm">Belum ada entri jurnal</p>
                                <Button onClick={() => setActiveTab('new')} className="mt-4 gap-2" size="sm">
                                    <Plus className="h-4 w-4" /> Buat Jurnal Pertama
                                </Button>
                            </div>
                        ) : (
                            entries.map((entry) => (
                                <JournalEntryRow key={entry.id} entry={entry} onVoid={handleVoid} />
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
