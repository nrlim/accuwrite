'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgingBucket {
    count: number;
    total: number;
}

interface AgingSummary {
    current: AgingBucket;
    '1-30': AgingBucket;
    '31-60': AgingBucket;
    '61-90': AgingBucket;
    '91+': AgingBucket;
}

interface AgingReportProps {
    summary: AgingSummary;
}

const fmt = (n: number) =>
    `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;

const bucketConfig = [
    {
        key: 'current' as const,
        label: 'Belum Jatuh Tempo',
        sublabel: '(Current)',
        icon: CheckCircle2,
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
        key: '1-30' as const,
        label: '1-30 Hari',
        sublabel: 'Terlambat sedikit',
        icon: Clock,
        barColor: 'bg-amber-400',
        textColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
        key: '31-60' as const,
        label: '31-60 Hari',
        sublabel: 'Perlu tindak lanjut',
        icon: Clock,
        barColor: 'bg-orange-500',
        textColor: 'text-orange-700 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
        key: '61-90' as const,
        label: '61-90 Hari',
        sublabel: 'Kritis – segera tagih',
        icon: AlertTriangle,
        barColor: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
    },
    {
        key: '91+' as const,
        label: '> 91 Hari',
        sublabel: 'Macet – evaluasi piutang',
        icon: TrendingDown,
        barColor: 'bg-red-800',
        textColor: 'text-red-900 dark:text-red-300',
        bgColor: 'bg-red-100 dark:bg-red-950/30',
        borderColor: 'border-red-300 dark:border-red-800',
    },
];

export function AgingReport({ summary }: AgingReportProps) {
    const grandTotal = Object.values(summary).reduce((s, b) => s + b.total, 0);

    return (
        <div className="space-y-5">
            {/* Grand Total */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white">
                <BarChart3 className="h-8 w-8 opacity-80" />
                <div>
                    <p className="text-xs font-medium opacity-80">Total Piutang Beredar</p>
                    <p className="text-2xl font-bold font-mono">{fmt(grandTotal)}</p>
                </div>
            </div>

            {/* Stacked Bar */}
            <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Distribusi Umur Piutang</p>
                <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                    {bucketConfig.map((b) => {
                        const pct = grandTotal > 0 ? (summary[b.key].total / grandTotal) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                            <motion.div
                                key={b.key}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                                className={cn('h-full relative group', b.barColor)}
                                style={{ minWidth: pct > 0 ? '2px' : '0' }}
                                title={`${b.label}: ${pct.toFixed(1)}%`}
                            >
                                {pct > 8 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                        {pct.toFixed(0)}%
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-1">
                    {bucketConfig.map((b) => (
                        <div key={b.key} className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <div className={cn('w-2 h-2 rounded-sm', b.barColor)} />
                            {b.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bucket Cards */}
            <div className="space-y-3">
                {bucketConfig.map((b, idx) => {
                    const bucket = summary[b.key];
                    const Icon = b.icon;
                    const pct = grandTotal > 0 ? (bucket.total / grandTotal) * 100 : 0;

                    return (
                        <motion.div
                            key={b.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08, duration: 0.35 }}
                            className={cn('rounded-xl border p-4', b.bgColor, b.borderColor)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Icon className={cn('h-4 w-4', b.textColor)} />
                                    <div>
                                        <p className={cn('text-sm font-semibold', b.textColor)}>{b.label}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{b.sublabel}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn('text-base font-bold font-mono', b.textColor)}>{fmt(bucket.total)}</p>
                                    <p className="text-xs text-zinc-500">{bucket.count} invoice</p>
                                </div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="h-1.5 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.3, ease: 'easeOut' }}
                                    className={cn('h-full rounded-full', b.barColor)}
                                />
                            </div>
                            <p className="text-right text-xs text-zinc-400 mt-1">{pct.toFixed(1)}% dari total</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
