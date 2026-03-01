'use client';

import React, { useState, useTransition } from 'react';
import {
    AlertTriangle, CheckCircle2, Clock, XCircle, FileText,
    ChevronDown, Eye, CreditCard, Building2, RefreshCw, Banknote,
    ArrowUpCircle, MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { recordBillPayment, voidBill, type RecordBillPaymentData } from '@/actions/bill.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

export interface Bill {
    id: string;
    number: string;
    date: string | Date;
    dueDate: string | Date;
    status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
    subtotal: string | number;
    taxAmount: string | number;
    totalAmount: string | number;
    paidAmount: string | number;
    notes: string | null;
    contact: { id: string; name: string };
    items: {
        id: string; description: string;
        quantity: string | number; unitPrice: string | number;
        taxRate: string | number; amount: string | number;
        account: { id: string; code: string; name: string };
    }[];
    payments: { id: string; date: string | Date; amount: string | number; method: string }[];
    journalEntry: { id: string; reference: string; status: string } | null;
}

interface BillManagerProps {
    bills: Bill[];
    apAccounts: { id: string; code: string; name: string }[];
    cashAccounts: { id: string; code: string; name: string }[];
    onRefresh: () => void;
}

const fmt = (n: number | string) => `Rp ${Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: FileText },
    UNPAID: { label: 'Belum Bayar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    PARTIAL: { label: 'Sebagian', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle },
    PAID: { label: 'Lunas', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    OVERDUE: { label: 'Jatuh Tempo', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
    VOID: { label: 'Batal', color: 'bg-zinc-100 text-zinc-400 line-through', icon: XCircle },
};

// =================== PAYMENT MODAL ===================

function PaymentModal({
    bill,
    apAccounts,
    cashAccounts,
    onClose,
    onSuccess,
}: {
    bill: Bill;
    apAccounts: { id: string; code: string; name: string }[];
    cashAccounts: { id: string; code: string; name: string }[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const remaining = Number(bill.totalAmount) - Number(bill.paidAmount);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: String(remaining),
        method: 'Transfer Bank',
        reference: '',
        notes: '',
        cashAccountId: cashAccounts[0]?.id ?? '',
        apAccountId: apAccounts[0]?.id ?? '',
    });

    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await recordBillPayment({
                billId: bill.id,
                date: form.date,
                amount: parseFloat(form.amount),
                method: form.method,
                reference: form.reference || null,
                notes: form.notes || null,
                cashAccountId: form.cashAccountId,
                apAccountId: form.apAccountId,
            } satisfies RecordBillPaymentData);
            if (result.success) { showNotification(result.message, 'success'); onSuccess(); onClose(); }
            else showNotification(result.error, 'error');
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
            >
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-orange-500" />
                        Bayar Tagihan
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        {bill.number} · <span className="text-orange-600 font-medium">{fmt(remaining)}</span> tersisa
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Tanggal Bayar *</Label>
                            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Jumlah *</Label>
                            <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} min="0.01" max={remaining} step="any" className="font-mono text-sm" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Akun Hutang (AP) *</Label>
                            <select value={form.apAccountId} onChange={(e) => set('apAccountId', e.target.value)}
                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                                {apAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Akun Kas/Bank *</Label>
                            <select value={form.cashAccountId} onChange={(e) => set('cashAccountId', e.target.value)}
                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                                {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Metode Bayar</Label>
                            <select value={form.method} onChange={(e) => set('method', e.target.value)}
                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                {['Transfer Bank', 'Tunai', 'Cek/Giro', 'QRIS'].map((m) => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Referensi</Label>
                            <Input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="No. transfer..." className="text-sm font-mono" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={isPending} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2">
                            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                            Bayar Sekarang
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// =================== BILL CARD ===================

function BillCard({ bill, apAccounts, cashAccounts, onRefresh }: {
    bill: Bill;
    apAccounts: { id: string; code: string; name: string }[];
    cashAccounts: { id: string; code: string; name: string }[];
    onRefresh: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const cfg = statusConfig[bill.status];
    const StatusIcon = cfg.icon;

    const total = Number(bill.totalAmount);
    const paid = Number(bill.paidAmount);
    const remaining = total - paid;
    const payProgress = total > 0 ? (paid / total) * 100 : 0;
    const daysUntilDue = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const handleVoid = () => {
        if (!confirm(`Batalkan bill ${bill.number}? Jurnal terkait akan di-void.`)) return;
        startTransition(async () => {
            const r = await voidBill(bill.id);
            if (r.success) { showNotification(r.message, 'success'); onRefresh(); }
            else showNotification(r.error, 'error');
        });
    };

    return (
        <>
            <motion.div
                layout
                className={cn(
                    'rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-shadow hover:shadow-md',
                    bill.status === 'OVERDUE'
                        ? 'border-red-200 dark:border-red-800'
                        : bill.status === 'VOID'
                            ? 'border-zinc-100 dark:border-zinc-800 opacity-60'
                            : 'border-zinc-200 dark:border-zinc-700'
                )}
            >
                {/* Card Header */}
                <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-100">{bill.number}</span>
                            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
                                <StatusIcon className="h-3 w-3" /> {cfg.label}
                            </span>
                            {bill.status === 'OVERDUE' && (
                                <span className="text-xs text-red-600 font-medium">
                                    {Math.abs(daysUntilDue)} hari terlambat
                                </span>
                            )}
                            {(bill.status === 'UNPAID' || bill.status === 'PARTIAL') && daysUntilDue >= 0 && (
                                <span className={cn('text-xs font-medium', daysUntilDue <= 7 ? 'text-amber-600' : 'text-zinc-400')}>
                                    Jatuh tempo {daysUntilDue} hari lagi
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="font-medium">{bill.contact.name}</span>
                            <span>·</span>
                            <span>{fmtDate(bill.date)}</span>
                            {bill.journalEntry && (
                                <><span>·</span><span className="font-mono text-zinc-400">{bill.journalEntry.reference}</span></>
                            )}
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="font-bold font-mono text-orange-600 dark:text-orange-400">{fmt(total)}</p>
                        {paid > 0 && (
                            <p className="text-xs text-zinc-400 font-mono">sisa {fmt(remaining)}</p>
                        )}
                    </div>
                </div>

                {/* Payment Progress */}
                {(bill.status === 'PARTIAL' || bill.status === 'PAID') && (
                    <div className="px-4 pb-2">
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                style={{ width: `${payProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{fmt(paid)} dibayar dari {fmt(total)}</p>
                    </div>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    {!['PAID', 'VOID'].includes(bill.status) && (
                        <Button
                            size="sm"
                            onClick={() => setPaymentOpen(true)}
                            className="text-xs gap-1. h-7 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Banknote className="h-3 w-3" /> Bayar
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs gap-1 h-7 text-zinc-600"
                    >
                        <Eye className="h-3 w-3" />
                        {expanded ? 'Tutup' : 'Detail'}
                    </Button>
                    {!['PAID', 'VOID'].includes(bill.status) && (
                        <button
                            onClick={handleVoid}
                            disabled={isPending}
                            className="ml-auto text-xs text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                            Batalkan
                        </button>
                    )}
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-100 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="p-4 space-y-3">
                                {/* Items */}
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                                            <th className="text-left py-1">Deskripsi</th>
                                            <th className="text-left py-1">Akun</th>
                                            <th className="text-right py-1">Qty</th>
                                            <th className="text-right py-1">Harga</th>
                                            <th className="text-right py-1">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                        {bill.items.map((item) => (
                                            <tr key={item.id} className="text-zinc-700 dark:text-zinc-300">
                                                <td className="py-1.5">{item.description}</td>
                                                <td className="py-1.5 text-zinc-400">{item.account.code} {item.account.name}</td>
                                                <td className="py-1.5 text-right font-mono">{Number(item.quantity)}</td>
                                                <td className="py-1.5 text-right font-mono">{fmt(Number(item.unitPrice))}</td>
                                                <td className="py-1.5 text-right font-mono font-medium">{fmt(Number(item.amount))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Payment history */}
                                {bill.payments.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-500 mb-1">Riwayat Pembayaran</p>
                                        <div className="space-y-1">
                                            {bill.payments.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                                    <span>{fmtDate(p.date)} · {p.method}</span>
                                                    <span className="font-mono text-emerald-600">{fmt(Number(p.amount))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {paymentOpen && (
                <PaymentModal
                    bill={bill}
                    apAccounts={apAccounts}
                    cashAccounts={cashAccounts}
                    onClose={() => setPaymentOpen(false)}
                    onSuccess={() => { setPaymentOpen(false); onRefresh(); }}
                />
            )}
        </>
    );
}

// =================== MAIN ===================

export function BillManager({ bills, apAccounts, cashAccounts, onRefresh }: BillManagerProps) {
    const [filterStatus, setFilterStatus] = useState('ALL');

    const filtered = filterStatus === 'ALL'
        ? bills
        : bills.filter((b) => b.status === filterStatus);

    const totalOutstanding = bills
        .filter((b) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(b.status))
        .reduce((s, b) => s + Number(b.totalAmount) - Number(b.paidAmount), 0);

    const statuses = ['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID'];
    const statusLabels: Record<string, string> = {
        ALL: 'Semua', UNPAID: 'Belum Bayar', PARTIAL: 'Sebagian',
        PAID: 'Lunas', OVERDUE: 'Jatuh Tempo', VOID: 'Batal',
    };

    return (
        <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
                {statuses.map((s) => {
                    const count = s === 'ALL' ? bills.length : bills.filter((b) => b.status === s).length;
                    return (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                filterStatus === s
                                    ? s === 'OVERDUE'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-orange-600 text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            )}
                        >
                            {statusLabels[s]}
                            <span className={cn('text-xs', filterStatus === s ? 'opacity-80' : 'text-zinc-400')}>{count}</span>
                        </button>
                    );
                })}
                {totalOutstanding > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        Total Hutang: <span className="font-bold font-mono">{`Rp ${totalOutstanding.toLocaleString('id-ID')}`}</span>
                    </div>
                )}
            </div>

            {/* Bill list */}
            {filtered.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center">
                    <FileText className="h-8 w-8 text-zinc-300 mb-3" />
                    <p className="text-sm text-zinc-400">Tidak ada tagihan</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((bill) => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                apAccounts={apAccounts}
                                cashAccounts={cashAccounts}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
