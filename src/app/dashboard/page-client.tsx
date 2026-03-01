'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, AlertTriangle, FileText, ArrowRight, CheckCircle2,
    Wallet, Activity, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Invoice {
    id: string;
    number: string;
    dueDate: string | Date;
    totalAmount: number | string;
    paidAmount: number | string;
    status: string;
    contact: { name: string };
}

interface ChartData {
    month: string;
    revenue: number;
    expense: number;
}

interface DashboardStats {
    totalAssets: number;
    totalReceivables: number;
    netIncomeThisMonth: number;
    cashBalanceThisMonth: number;
    cashGrowth: number;
    chartData: ChartData[];
    recentInvoices: Invoice[];
    overdueCount: number;
}

interface DashboardPageClientProps {
    stats: DashboardStats | null;
}

const fmt = (n: number) =>
    `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { label: string; color: string }> = {
    UNPAID: { label: 'Belum Bayar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    PARTIAL: { label: 'Bayar Sebagian', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    OVERDUE: { label: 'Jatuh Tempo', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    PAID: { label: 'Lunas', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export function DashboardPageClient({ stats }: DashboardPageClientProps) {
    const metrics = [
        {
            title: 'Total Aset',
            value: fmt(stats?.totalAssets ?? 0),
            subtitle: 'Proporsi kekayaan bersih berjalan',
            icon: DollarSign,
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            borderColor: 'border-blue-200 dark:border-blue-800',
            href: '/dashboard/buku-besar',
        },
        {
            title: 'Total Piutang Berjalan',
            value: fmt(stats?.totalReceivables ?? 0),
            subtitle: `${stats?.overdueCount ?? 0} invoice jatuh tempo`,
            icon: TrendingUp,
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
            borderColor: 'border-orange-200 dark:border-orange-800',
            href: '/dashboard/piutang',
        },
        {
            title: 'Laba Bersih Bulan Ini',
            value: fmt(stats?.netIncomeThisMonth ?? 0),
            subtitle: 'Berdasarkan jurnal bulan berjalan',
            icon: Activity,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            href: '/dashboard/jurnal',
        },
        {
            title: 'Kas & Bank',
            value: fmt(stats?.cashBalanceThisMonth ?? 0),
            subtitle: stats?.cashGrowth !== undefined
                ? `${stats.cashGrowth > 0 ? '+' : ''}${Math.round(stats.cashGrowth)}% dari bulan lalu`
                : 'Analisis saldo kas & bank',
            icon: Wallet,
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            borderColor: 'border-purple-200 dark:border-purple-800',
            href: '/dashboard/kas-bank',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ringkasan</h1>
                <p className="text-zinc-500 text-sm mt-0.5">
                    Selamat datang di dashboard keuangan Accuwrite.
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((m, i) => {
                    const Icon = m.icon;
                    const Wrapper = m.href ? Link : React.Fragment;
                    const wrapperProps = m.href ? { href: m.href } : {};
                    return (
                        <motion.div
                            key={m.title}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                        >
                            {/* @ts-ignore */}
                            <Wrapper {...wrapperProps}>
                                <div className={cn(
                                    'rounded-xl border bg-white dark:bg-zinc-900 p-5 cursor-default transition-all',
                                    m.borderColor,
                                    m.href && 'hover:shadow-md hover:scale-[1.02] cursor-pointer'
                                )}>
                                    <div className="flex items-start justify-between">
                                        <div className={cn('p-2.5 rounded-xl', m.iconBg)}>
                                            <Icon className={cn('h-5 w-5', m.iconColor)} />
                                        </div>
                                        {m.href && <ArrowRight className="h-4 w-4 text-zinc-300" />}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.title}</p>
                                        <p className={cn("text-xl font-bold mt-0.5 font-mono", (m.value as string).includes('-') ? "text-red-500" : "text-zinc-900 dark:text-zinc-100")}>{m.value}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">{m.subtitle}</p>
                                    </div>
                                </div>
                            </Wrapper>
                        </motion.div>
                    );
                })}
            </div>

            {/* Two-column layout */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Chart: Pendapatan vs Pengeluaran (6 Bulan Terakhir) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col"
                >
                    <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-zinc-400" />
                            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Pendapatan vs Pengeluaran (6 Bulan Terakhir)</h3>
                        </div>
                    </div>

                    <div className="p-4 flex-1 w-full min-h-[300px]">
                        {!stats?.chartData || stats.chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                                Tidak ada data jurnalisasi
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={(val: any) => [`Rp ${Number(val || 0).toLocaleString('id-ID')}`, '']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar name="Pendapatan" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar name="Pengeluaran" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Recent Invoices */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                    <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-400" />
                            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Tagihan Belum Lunas (AR)</h3>
                        </div>
                        <Link href="/dashboard/piutang" className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
                            Semua <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {!stats?.recentInvoices?.length ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
                                <p className="text-sm text-zinc-400">Semua tagihan lunas!</p>
                            </div>
                        ) : (
                            stats.recentInvoices.map((inv) => {
                                const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
                                const sc = statusConfig[inv.status] || statusConfig['UNPAID'];
                                return (
                                    <div key={inv.id} className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{inv.number}</span>
                                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', sc.color)}>{sc.label}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate">{inv.contact.name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">{fmt(outstanding)}</p>
                                            <p className={cn('text-xs', inv.status === 'OVERDUE' ? 'text-red-500' : 'text-zinc-400')}>
                                                J/T: {fmtDate(inv.dueDate)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
