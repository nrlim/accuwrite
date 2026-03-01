'use client';

import React, { useState, useCallback } from 'react';
import {
    Plus, RefreshCw, FileText, Building2, BarChart3,
    AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BillFormModal } from '@/components/accounting/bill-form-modal';
import { BillManager, type Bill } from '@/components/accounting/bill-manager';
import { AgingReport } from '@/components/accounting/aging-report-shared';
import { getBills, getAPAgingReport } from '@/actions/bill.actions';

// =================== TYPES ===================

interface Account { id: string; code: string; name: string; type: string; initialBalance?: number; }

interface HutangPageClientProps {
    initialBills: Bill[];
    agingData: {
        summary: {
            current: { count: number; total: number };
            '1-30': { count: number; total: number };
            '31-60': { count: number; total: number };
            '61-90': { count: number; total: number };
            '91+': { count: number; total: number };
        };
        bills: any[];
    } | null;
    vendors: { id: string; name: string }[];
    expenseAccounts: Account[];
    apAccounts: Account[];
    cashAccounts: Account[];
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

// =================== COMPONENT ===================

export function HutangPageClient({
    initialBills,
    agingData: initialAgingData,
    vendors,
    expenseAccounts,
    apAccounts,
    cashAccounts,
}: HutangPageClientProps) {
    const [activeTab, setActiveTab] = useState<'TAGIHAN' | 'AGING'>('TAGIHAN');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [agingData, setAgingData] = useState(initialAgingData);

    // Quick stats
    const totalOutstanding = bills
        .filter((b) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(b.status))
        .reduce((s, b) => s + Number(b.totalAmount) - Number(b.paidAmount), 0);
    const overdueCount = bills.filter((b) => b.status === 'OVERDUE').length;
    const unpaidCount = bills.filter((b) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(b.status)).length;
    const paidCount = bills.filter((b) => b.status === 'PAID').length;

    // ── Refresh ──────────────────────────────────────────────
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const [billsRes, agingRes] = await Promise.all([getBills(), getAPAgingReport()]);

        if (billsRes.success) {
            setBills(billsRes.data.map((b: any) => ({
                ...b,
                subtotal: Number(b.subtotal),
                taxAmount: Number(b.taxAmount),
                totalAmount: Number(b.totalAmount),
                paidAmount: Number(b.paidAmount),
                date: new Date(b.date).toISOString(),
                dueDate: new Date(b.dueDate).toISOString(),
                items: b.items.map((i: any) => ({
                    ...i,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    taxRate: Number(i.taxRate),
                    amount: Number(i.amount),
                })),
                payments: b.payments.map((p: any) => ({
                    ...p,
                    amount: Number(p.amount),
                    date: new Date(p.date).toISOString(),
                })),
            })));
        }
        if (agingRes.success) {
            setAgingData({
                summary: agingRes.data.summary,
                bills: agingRes.data.bills.map((b: any) => ({
                    ...b,
                    totalAmount: Number(b.totalAmount),
                    paidAmount: Number(b.paidAmount),
                    dueDate: new Date(b.dueDate).toISOString(),
                })),
            });
        }
        setIsRefreshing(false);
    }, []);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-orange-600" />
                        Hutang Usaha
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Accounts Payable (AP) · Tagihan vendor & pembayaran</p>
                </div>
                <div className="flex items-center gap-2">
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
                        onClick={() => setIsFormOpen(true)}
                        className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Tagihan
                    </Button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Outstanding', value: fmt(totalOutstanding), sub: `${unpaidCount} tagihan`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { label: 'Jatuh Tempo', value: String(overdueCount), sub: 'tagihan terlambat', color: overdueCount > 0 ? 'text-red-600' : 'text-zinc-400', bg: overdueCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-zinc-50 dark:bg-zinc-800' },
                    { label: 'Lunas Bulan Ini', value: String(paidCount), sub: 'tagihan selesai', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Total Tagihan', value: String(bills.length), sub: 'semua status', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map(({ label, value, sub, color, bg }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('rounded-xl p-4', bg)}
                    >
                        <p className="text-xs text-zinc-500 mb-1">{label}</p>
                        <p className={cn('font-bold text-xl font-mono', color)}>{value}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Overdue Alert ── */}
            {overdueCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                            ⚠️ {overdueCount} tagihan melewati jatuh tempo!
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500">
                            Segera lakukan pembayaran untuk menghindari denda atau gangguan hubungan dengan vendor.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
                {[
                    { key: 'TAGIHAN' as const, label: 'Daftar Tagihan', icon: FileText, count: bills.length },
                    { key: 'AGING' as const, label: 'Aging Report', icon: BarChart3, count: unpaidCount },
                ].map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === key
                                ? 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'TAGIHAN' && (
                    <BillManager
                        bills={bills}
                        apAccounts={apAccounts}
                        cashAccounts={cashAccounts}
                        onRefresh={refresh}
                    />
                )}
                {activeTab === 'AGING' && agingData && (
                    <AgingReport
                        summary={agingData.summary}
                        bills={agingData.bills}
                        type="AP"
                    />
                )}
            </motion.div>

            {/* ── Bill Form Modal ── */}
            <BillFormModal
                isOpen={isFormOpen}
                vendors={vendors}
                expenseAccounts={expenseAccounts}
                apAccounts={apAccounts}
                onClose={() => setIsFormOpen(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
