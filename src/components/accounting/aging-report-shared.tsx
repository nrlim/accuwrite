'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// =================== TYPES ===================

interface AgingBucket {
    count: number;
    total: number;
}

interface AgingReportProps {
    summary: {
        current: AgingBucket;
        '1-30': AgingBucket;
        '31-60': AgingBucket;
        '61-90': AgingBucket;
        '91+': AgingBucket;
    };
    bills: {
        id: string;
        number: string;
        contact: { name: string };
        dueDate: string | Date;
        totalAmount: string | number;
        paidAmount: string | number;
        status: string;
        daysOverdue?: number;
        outstanding?: number;
    }[];
    type?: 'AR' | 'AP';
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// =================== COMPONENT ===================

export function AgingReport({ summary, bills, type = 'AP' }: AgingReportProps) {
    const grandTotal = Object.values(summary).reduce((s, b) => s + b.total, 0);
    const isAP = type === 'AP';

    const bucketConfig = [
        {
            key: 'current' as const,
            label: 'Belum Jatuh Tempo',
            sublabel: '≤ 0 hari',
            color: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            icon: CheckCircle2,
        },
        {
            key: '1-30' as const,
            label: '1 – 30 Hari',
            sublabel: 'Terlambat ringan',
            color: 'from-amber-400 to-yellow-500',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            icon: Clock,
        },
        {
            key: '31-60' as const,
            label: '31 – 60 Hari',
            sublabel: 'Perlu perhatian',
            color: 'from-orange-500 to-amber-600',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            icon: AlertTriangle,
        },
        {
            key: '61-90' as const,
            label: '61 – 90 Hari',
            sublabel: 'Kritis',
            color: 'from-red-500 to-orange-600',
            bg: 'bg-red-50 dark:bg-red-900/20',
            badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            icon: AlertTriangle,
        },
        {
            key: '91+' as const,
            label: '> 90 Hari',
            sublabel: 'Sangat kritis',
            color: 'from-red-700 to-red-900',
            bg: 'bg-red-100 dark:bg-red-900/30',
            badge: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            icon: TrendingDown,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Bar Chart */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        Laporan Umur {isAP ? 'Hutang' : 'Piutang'} (Aging Report)
                    </h3>
                    <div className="ml-auto text-xs text-zinc-500">
                        Total: <span className="font-bold font-mono text-orange-600 dark:text-orange-400">{fmt(grandTotal)}</span>
                    </div>
                </div>

                {/* Bucket cards */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {bucketConfig.map(({ key, label, sublabel, color, bg, badge, icon: Icon }) => {
                        const bucket = summary[key];
                        const pct = grandTotal > 0 ? (bucket.total / grandTotal) * 100 : 0;
                        return (
                            <div key={key} className={cn('rounded-xl p-4 space-y-2', bg)}>
                                <div className="flex items-center gap-1.5">
                                    <Icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{label}</span>
                                </div>
                                <p className="text-xs text-zinc-400">{sublabel}</p>
                                <p className="font-bold font-mono text-sm text-zinc-900 dark:text-zinc-100">{fmt(bucket.total)}</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn('h-full rounded-full bg-gradient-to-r', color)}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, delay: 0.1 }}
                                        />
                                    </div>
                                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', badge)}>
                                        {bucket.count}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed table */}
            {bills.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Detail {isAP ? 'Hutang' : 'Piutang'} Outstanding
                        </h3>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {bills.map((bill) => {
                            const daysOverdue = bill.daysOverdue ?? 0;
                            const outstanding = bill.outstanding ?? (Number(bill.totalAmount) - Number(bill.paidAmount));
                            const urgency =
                                daysOverdue > 90 ? 'border-l-4 border-l-red-600' :
                                    daysOverdue > 60 ? 'border-l-4 border-l-orange-500' :
                                        daysOverdue > 30 ? 'border-l-4 border-l-amber-400' :
                                            daysOverdue > 0 ? 'border-l-4 border-l-yellow-400' :
                                                '';

                            return (
                                <div key={bill.id} className={cn('flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors', urgency)}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">{bill.number}</span>
                                            {daysOverdue > 0 && (
                                                <span className="text-xs text-red-600 font-medium">{daysOverdue}h</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{bill.contact.name}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-bold text-sm text-orange-600 dark:text-orange-400">{fmt(outstanding)}</p>
                                        <p className="text-xs text-zinc-400">Jatuh: {fmtDate(bill.dueDate)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {bills.length === 0 && (
                <div className="py-12 flex flex-col items-center text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Semua {isAP ? 'hutang' : 'piutang'} sudah lunas!</p>
                    <p className="text-sm text-zinc-400 mt-1">Tidak ada outstanding {isAP ? 'hutang' : 'piutang'} saat ini</p>
                </div>
            )}
        </div>
    );
}
