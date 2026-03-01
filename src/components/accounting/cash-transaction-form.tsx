'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Receipt, Landmark, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createCashTransaction, type CashTransactionData } from '@/actions/cash.actions';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';

// =================== TYPES ===================

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    category: string;
}

interface Contact { id: string; name: string; }

interface CashTransactionFormProps {
    isOpen: boolean;
    defaultType?: 'IN' | 'OUT';
    cashAccounts: Account[];   // ASSET accounts untuk Kas/Bank
    allAccounts: Account[];    // Semua akun DETAIL
    contacts: Contact[];
    defaultCashAccountId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

// =================== CATEGORY PRESETS ===================

const IN_PRESETS = [
    { label: 'Pendapatan Jasa', type: 'REVENUE' },
    { label: 'Pendapatan Penjualan', type: 'REVENUE' },
    { label: 'Pelunasan Piutang', type: 'ASSET' },
    { label: 'Pinjaman Diterima', type: 'LIABILITY' },
    { label: 'Setoran Modal', type: 'EQUITY' },
];

const OUT_PRESETS = [
    { label: 'Beban Gaji', type: 'EXPENSE' },
    { label: 'Beban Listrik/Air', type: 'EXPENSE' },
    { label: 'Beban Sewa', type: 'EXPENSE' },
    { label: 'Pembelian Aset', type: 'ASSET' },
    { label: 'Pembayaran Hutang', type: 'LIABILITY' },
    { label: 'Penarikan Modal', type: 'EQUITY' },
];

const typeLabel: Record<string, string> = {
    ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Modal',
    REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};

// =================== COMPONENT ===================

export function CashTransactionForm({
    isOpen,
    defaultType = 'IN',
    cashAccounts,
    allAccounts,
    contacts,
    defaultCashAccountId,
    onClose,
    onSuccess,
}: CashTransactionFormProps) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();
    const [txType, setTxType] = useState<'IN' | 'OUT'>(defaultType);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        reference: '',
        notes: '',
        cashAccountId: defaultCashAccountId ?? '',
        counterAccountId: '',
        contactId: '',
    });

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setTxType(defaultType);
            setForm({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                reference: '',
                notes: '',
                cashAccountId: defaultCashAccountId ?? '',
                counterAccountId: '',
                contactId: '',
            });
        }
    }, [isOpen, defaultType, defaultCashAccountId]);

    const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

    // Filter counter accounts based on tx type for smarter UX
    const counterAccounts = allAccounts.filter((a) => {
        if (a.id === form.cashAccountId) return false; // exclude selected cash account
        if (txType === 'IN') {
            // For money in: suggest revenue, equity, liability, or other assets (e.g. AR)
            return true;
        }
        // For money out: suggest expense, liability, asset (for payments)
        return true;
    });

    // Group counter accounts by type for <optgroup>
    const groupedCounterAccounts = (['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY'] as const).reduce(
        (acc, type) => {
            acc[type] = counterAccounts.filter((a) => a.type === type);
            return acc;
        },
        {} as Record<string, Account[]>
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            startLoading(`Mencatat ${txType === 'IN' ? 'Uang Masuk' : 'Uang Keluar'}...`);
            const result = await createCashTransaction({
                type: txType,
                date: form.date,
                amount: parseFloat(form.amount),
                description: form.description,
                reference: form.reference || undefined,
                notes: form.notes || undefined,
                cashAccountId: form.cashAccountId,
                counterAccountId: form.counterAccountId,
                contactId: form.contactId || undefined,
            } satisfies CashTransactionData);
            stopLoading();

            if (result.success) {
                showNotification(result.message, 'success');
                onSuccess();
                onClose();
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

    const isIN = txType === 'IN';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.94, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.94, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    >
                        {/* ── Type Toggle Header ── */}
                        <div className={cn(
                            'p-5 border-b border-zinc-100 dark:border-zinc-800',
                            isIN
                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
                                : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
                        )}>
                            <div className="flex items-center justify-between">
                                {/* Toggle buttons */}
                                <div className="flex gap-1 bg-white/60 dark:bg-zinc-800/60 rounded-xl p-1 backdrop-blur">
                                    <button
                                        type="button"
                                        onClick={() => setTxType('IN')}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                            isIN
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'text-zinc-500 hover:text-emerald-600'
                                        )}
                                    >
                                        <ArrowDownCircle className="h-4 w-4" />
                                        Uang Masuk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTxType('OUT')}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                            !isIN
                                                ? 'bg-red-500 text-white shadow-sm'
                                                : 'text-zinc-500 hover:text-red-600'
                                        )}
                                    >
                                        <ArrowUpCircle className="h-4 w-4" />
                                        Uang Keluar
                                    </button>
                                </div>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <p className={cn(
                                'text-xs mt-2 font-medium',
                                isIN ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                            )}>
                                {isIN
                                    ? '💡 Jurnal otomatis: Debit Kas/Bank → Kredit Akun Lawan'
                                    : '💡 Jurnal otomatis: Debit Akun Lawan → Kredit Kas/Bank'
                                }
                            </p>
                        </div>

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Amount — big and prominent */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Nominal (Rp) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">Rp</span>
                                    <Input
                                        type="number"
                                        value={form.amount}
                                        onChange={(e) => set('amount', e.target.value)}
                                        placeholder="0"
                                        min="1"
                                        step="0.01"
                                        className={cn(
                                            'pl-10 text-xl font-bold font-mono h-12',
                                            isIN ? 'focus:ring-emerald-400' : 'focus:ring-red-400'
                                        )}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Keterangan *</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder={isIN ? 'cth: Pembayaran jasa konsultasi Maret' : 'cth: Bayar tagihan listrik Maret'}
                                    className="text-sm"
                                    required
                                />
                                {/* Quick presets */}
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {(isIN ? IN_PRESETS : OUT_PRESETS).map((p) => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => set('description', p.label)}
                                            className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accounts row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <Landmark className="h-3 w-3" />
                                        Akun Kas/Bank *
                                    </Label>
                                    <select
                                        value={form.cashAccountId}
                                        onChange={(e) => set('cashAccountId', e.target.value)}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">— Pilih —</option>
                                        {cashAccounts.map((a) => (
                                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <Receipt className="h-3 w-3" />
                                        Akun {isIN ? 'Pendapatan/Sumber' : 'Beban/Tujuan'} *
                                    </Label>
                                    <select
                                        value={form.counterAccountId}
                                        onChange={(e) => set('counterAccountId', e.target.value)}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">— Pilih —</option>
                                        {Object.entries(groupedCounterAccounts).map(([type, accs]) =>
                                            accs.length > 0 ? (
                                                <optgroup key={type} label={typeLabel[type]}>
                                                    {accs.map((a) => (
                                                        <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                                                    ))}
                                                </optgroup>
                                            ) : null
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Date & Reference */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Tanggal *</Label>
                                    <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="text-sm" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">No. Referensi / Nota</Label>
                                    <Input
                                        value={form.reference}
                                        onChange={(e) => set('reference', e.target.value)}
                                        placeholder="Auto-generate jika kosong"
                                        className="text-sm font-mono"
                                    />
                                </div>
                            </div>

                            {/* Contact (optional) */}
                            {contacts.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">{isIN ? 'Pembayar' : 'Penerima'} (Opsional)</Label>
                                    <select
                                        value={form.contactId}
                                        onChange={(e) => set('contactId', e.target.value)}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">— Tidak Ada —</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className={cn(
                                        'flex-1 text-white gap-2',
                                        isIN
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    )}
                                >
                                    {isPending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : isIN ? (
                                        <ArrowDownCircle className="h-4 w-4" />
                                    ) : (
                                        <ArrowUpCircle className="h-4 w-4" />
                                    )}
                                    Catat {isIN ? 'Uang Masuk' : 'Uang Keluar'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
