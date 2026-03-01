'use client';

import React, { useState, useTransition } from 'react';
import {
    TrendingUp, Scale, RefreshCw, Calendar, Download,
    BarChart3, FileText, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PLReportView } from '@/components/accounting/pl-report';
import { BalanceSheetView } from '@/components/accounting/balance-sheet';
import { getProfitLossReport, getBalanceSheet } from '@/actions/reports.actions';
import type { PLReport, BalanceSheet } from '@/actions/reports.actions';

// =================== TYPES ===================

interface LaporanPageClientProps {
    initialPL: PLReport | null;
    initialBS: BalanceSheet | null;
    defaultStartDate: string;
    defaultEndDate: string;
}

// =================== QUICK PERIOD PRESETS ===================

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');

const PRESETS = [
    { label: 'Bulan Ini', start: `${y}-${m}-01`, end: now.toISOString().split('T')[0] },
    {
        label: 'Bulan Lalu',
        start: (() => { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.toISOString().split('T')[0]; })(),
        end: (() => { const d = new Date(now.getFullYear(), now.getMonth(), 0); return d.toISOString().split('T')[0]; })(),
    },
    { label: 'Q1', start: `${y}-01-01`, end: `${y}-03-31` },
    { label: 'Q2', start: `${y}-04-01`, end: `${y}-06-30` },
    { label: 'Q3', start: `${y}-07-01`, end: `${y}-09-30` },
    { label: 'Q4', start: `${y}-10-01`, end: `${y}-12-31` },
    { label: `${y}`, start: `${y}-01-01`, end: `${y}-12-31` },
];

// =================== COMPONENT ===================

export function LaporanPageClient({
    initialPL,
    initialBS,
    defaultStartDate,
    defaultEndDate,
}: LaporanPageClientProps) {
    const [activeTab, setActiveTab] = useState<'PL' | 'BS'>('PL');
    const [isPending, startTransition] = useTransition();
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [bsDate, setBsDate] = useState(defaultEndDate);

    const [plData, setPlData] = useState<PLReport | null>(initialPL);
    const [bsData, setBsData] = useState<BalanceSheet | null>(initialBS);

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setStartDate(preset.start);
        setEndDate(preset.end);
    };

    const refreshPL = () => {
        startTransition(async () => {
            const res = await getProfitLossReport(startDate, endDate);
            if (res.success) setPlData(res.data);
        });
    };

    const refreshBS = () => {
        startTransition(async () => {
            const res = await getBalanceSheet(bsDate);
            if (res.success) setBsData(res.data);
        });
    };

    const fmt = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-brand-600" />
                        Laporan Keuangan
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Laba Rugi · Neraca · Analisis Keuangan
                    </p>
                </div>
            </div>

            {/* ── KPI Summary Chips ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Laba Bersih',
                        value: plData ? fmt(plData.netIncome) : '—',
                        sub: plData ? (plData.isProfit ? '✅ Profitabel' : '❌ Rugi') : 'Belum dihitung',
                        color: plData ? (plData.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600') : 'text-zinc-400',
                        bg: plData ? (plData.isProfit ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20') : 'bg-zinc-50 dark:bg-zinc-800',
                        icon: TrendingUp,
                    },
                    {
                        label: 'Total Aset',
                        value: bsData ? fmt(bsData.totalAssets) : '—',
                        sub: 'Per tanggal neraca',
                        color: 'text-blue-600 dark:text-blue-400',
                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                        icon: Scale,
                    },
                    {
                        label: 'Total Kewajiban',
                        value: bsData ? fmt(bsData.totalLiabilities) : '—',
                        sub: 'Hutang usaha & lainnya',
                        color: 'text-amber-600 dark:text-amber-400',
                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                        icon: FileText,
                    },
                    {
                        label: 'Ekuitas Bersih',
                        value: bsData ? fmt(bsData.totalEquity + bsData.netIncome) : '—',
                        sub: bsData?.isBalanced ? '✅ Neraca seimbang' : '⚠️ Cek neraca',
                        color: 'text-purple-600 dark:text-purple-400',
                        bg: 'bg-purple-50 dark:bg-purple-900/20',
                        icon: BarChart3,
                    },
                ].map(({ label, value, sub, color, bg, icon: Icon }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('rounded-xl p-4', bg)}
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <p className="text-xs text-zinc-500">{label}</p>
                        </div>
                        <p className={cn('font-bold font-mono text-base', color)}>{value}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
                {[
                    { key: 'PL' as const, label: 'Laba Rugi (P&L)', icon: TrendingUp },
                    { key: 'BS' as const, label: 'Neraca (Balance Sheet)', icon: Scale },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === key
                                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Tab: P&L ── */}
            {activeTab === 'PL' && (
                <motion.div key="pl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Period selector */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <Calendar className="h-4 w-4" />
                            Periode Laporan
                        </div>
                        {/* Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    onClick={() => applyPreset(p)}
                                    className={cn(
                                        'px-3 py-1 rounded-lg text-xs font-medium transition-all border',
                                        startDate === p.start && endDate === p.end
                                            ? 'bg-brand-600 text-white border-brand-600'
                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-brand-400 hover:text-brand-600'
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {/* Custom range */}
                        <div className="flex items-center gap-3">
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm flex-1" />
                            <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm flex-1" />
                            <Button onClick={refreshPL} disabled={isPending} className="gap-2 shrink-0">
                                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Generate
                            </Button>
                        </div>
                    </div>

                    {plData ? (
                        <PLReportView report={plData} />
                    ) : (
                        <div className="py-16 text-center text-sm text-zinc-400">
                            Pilih periode dan klik Generate
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Tab: Balance Sheet ── */}
            {activeTab === 'BS' && (
                <motion.div key="bs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* As-of date selector */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <Calendar className="h-4 w-4" />
                                Per Tanggal
                            </div>
                            <Input
                                type="date"
                                value={bsDate}
                                onChange={(e) => setBsDate(e.target.value)}
                                className="text-sm w-44"
                            />
                            <Button onClick={refreshBS} disabled={isPending} className="gap-2">
                                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Generate
                            </Button>
                            <p className="text-xs text-zinc-400">
                                Neraca menampilkan posisi keuangan pada tanggal yang dipilih
                            </p>
                        </div>
                    </div>

                    {bsData ? (
                        <BalanceSheetView bs={bsData} />
                    ) : (
                        <div className="py-16 text-center text-sm text-zinc-400">
                            Pilih tanggal dan klik Generate
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
