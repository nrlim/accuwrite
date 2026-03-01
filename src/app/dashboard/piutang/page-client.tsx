'use client';

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, FileText, BarChart3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { InvoiceManager, type Invoice } from '@/components/accounting/invoice-manager';
import { AgingReport } from '@/components/accounting/aging-report';
import { InvoiceFormModal } from '@/components/accounting/invoice-form-modal';
import { getInvoices, getAgingReport } from '@/actions/invoice.actions';
import { cn } from '@/lib/utils';

interface Account { id: string; code: string; name: string; type: string; }
interface Contact { id: string; name: string; }
interface AgingSummary {
    current: { count: number; total: number };
    '1-30': { count: number; total: number };
    '31-60': { count: number; total: number };
    '61-90': { count: number; total: number };
    '91+': { count: number; total: number };
}

interface ARPageClientProps {
    initialInvoices: Invoice[];
    agingSummary: AgingSummary;
    accounts: Account[];
    contacts: Contact[];
}

const tabs = [
    { key: 'invoices', label: 'Invoice Manager', icon: FileText },
    { key: 'aging', label: 'Aging Report', icon: BarChart3 },
];

export function ARPageClient({ initialInvoices, agingSummary, accounts, contacts }: ARPageClientProps) {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [aging, setAging] = useState<AgingSummary>(agingSummary);
    const [activeTab, setActiveTab] = useState<'invoices' | 'aging'>('invoices');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const [invResult, agingResult] = await Promise.all([
            getInvoices(),
            getAgingReport(),
        ]);
        if (invResult.success) setInvoices(invResult.data as any);
        if (agingResult.success) setAging(agingResult.data.summary as any);
        setIsRefreshing(false);
    }, []);

    const totalOutstanding = invoices
        .filter((i) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(i.status))
        .reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Piutang (AR)</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Accounts Receivable · Sisa tagihan:{' '}
                        <span className="font-semibold text-red-600 dark:text-red-400">
                            Rp {totalOutstanding.toLocaleString('id-ID')}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                        onClick={() => setShowInvoiceForm(true)}
                        size="sm"
                        className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Invoice
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1 w-fit">
                {tabs.map((tab) => {
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
                {activeTab === 'invoices' ? (
                    <motion.div
                        key="invoices"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <InvoiceManager
                            invoices={invoices}
                            accounts={accounts}
                            contacts={contacts}
                            onRefresh={refresh}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="aging"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6"
                    >
                        <div className="mb-5">
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Laporan Umur Piutang</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Analisis keterlambatan pembayaran berdasarkan umur piutang</p>
                        </div>
                        <AgingReport summary={aging} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invoice Form Modal */}
            <InvoiceFormModal
                isOpen={showInvoiceForm}
                accounts={accounts}
                contacts={contacts}
                onClose={() => setShowInvoiceForm(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
