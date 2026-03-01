'use client';

import React, { useState, useTransition } from 'react';
import {
    FileText, Plus, Search, Filter, CreditCard, CheckCircle2, Clock, AlertTriangle,
    ChevronDown, Eye, DollarSign, Calendar, User, X, Send, Ban, Banknote, TrendingUp,
    BarChart3, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';

// =================== TYPES ===================

export interface Invoice {
    id: string;
    number: string;
    date: string | Date;
    dueDate: string | Date;
    status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
    totalAmount: number | string;
    paidAmount: number | string;
    notes?: string | null;
    contact: { id: string; name: string; email?: string | null };
    items: Array<{ id: string; description: string; quantity: number | string; unitPrice: number | string; amount: number | string }>;
    payments: Array<{ id: string; date: string | Date; amount: number | string; method: string; reference?: string | null }>;
}

interface Account { id: string; code: string; name: string; type: string; }
interface Contact { id: string; name: string; }

interface InvoiceManagerProps {
    invoices: Invoice[];
    accounts: Account[];
    contacts: Contact[];
    onRefresh?: () => void;
}

// =================== STATUS CONFIG ===================

const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: FileText },
    UNPAID: { label: 'Belum Bayar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Clock },
    PARTIAL: { label: 'Bayar Sebagian', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: CreditCard },
    PAID: { label: 'Lunas', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
    OVERDUE: { label: 'Jatuh Tempo', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
    VOID: { label: 'Dibatalkan', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 line-through', icon: Ban },
};

// =================== HELPERS ===================

const fmt = (n: number | string) =>
    `Rp ${Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// =================== PAYMENT MODAL ===================

function PaymentModal({
    invoice,
    accounts,
    onClose,
    onSuccess,
}: {
    invoice: Invoice;
    accounts: Account[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: String(Number(invoice.totalAmount) - Number(invoice.paidAmount)),
        method: 'Transfer Bank',
        reference: '',
        notes: '',
        cashAccountId: '',
        arAccountId: '',
    });

    const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    const arAccounts = accounts.filter((a) => a.type === 'ASSET');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            startLoading('Memproses pembayaran...');
            const { recordPayment } = await import('@/actions/invoice.actions');
            const result = await recordPayment({
                invoiceId: invoice.id,
                date: form.date,
                amount: parseFloat(form.amount),
                method: form.method,
                reference: form.reference || null,
                notes: form.notes || null,
                cashAccountId: form.cashAccountId,
                arAccountId: form.arAccountId,
            });
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
            >
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Catat Pembayaran</h3>
                        <p className="text-xs text-zinc-500">{invoice.number} · {invoice.contact.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Outstanding */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 flex justify-between text-sm">
                        <span className="text-zinc-500">Sisa Piutang:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{fmt(remaining)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Tanggal *</Label>
                            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Jumlah *</Label>
                            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="text-sm font-mono" min="1" max={remaining} step="0.01" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Metode Pembayaran *</Label>
                        <select
                            value={form.method}
                            onChange={(e) => setForm({ ...form, method: e.target.value })}
                            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option>Transfer Bank</option>
                            <option>Tunai</option>
                            <option>Cek/Giro</option>
                            <option>QRIS</option>
                            <option>Kartu Kredit</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Akun Kas/Bank (Debit) *</Label>
                        <select
                            value={form.cashAccountId}
                            onChange={(e) => setForm({ ...form, cashAccountId: e.target.value })}
                            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            required
                        >
                            <option value="">— Pilih Akun Kas —</option>
                            {arAccounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Akun Piutang (Kredit) *</Label>
                        <select
                            value={form.arAccountId}
                            onChange={(e) => setForm({ ...form, arAccountId: e.target.value })}
                            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            required
                        >
                            <option value="">— Pilih Akun Piutang —</option>
                            {arAccounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Referensi</Label>
                        <Input placeholder="No. bukti transfer..." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="text-sm" />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Banknote className="h-4 w-4" /> Simpan Pembayaran
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// =================== INVOICE DETAIL ===================

function InvoiceDetail({ invoice, accounts, onClose, onPayment }: {
    invoice: Invoice;
    accounts: Account[];
    onClose: () => void;
    onPayment: () => void;
}) {
    const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    const paidPct = Number(invoice.totalAmount) > 0
        ? (Number(invoice.paidAmount) / Number(invoice.totalAmount)) * 100
        : 0;
    const sc = statusConfig[invoice.status];
    const StatusIcon = sc.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-700"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1">INVOICE</p>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{invoice.number}</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className={cn('flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium', sc.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {sc.label}
                            </span>
                            <span className="text-xs text-zinc-400">{fmtDate(invoice.date)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer & Dates */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-0.5">
                            <p className="text-xs text-zinc-500">Customer</p>
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{invoice.contact.name}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs text-zinc-500">Tanggal Invoice</p>
                            <p className="text-sm font-medium">{fmtDate(invoice.date)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs text-zinc-500">Jatuh Tempo</p>
                            <p className={cn('text-sm font-medium', invoice.status === 'OVERDUE' ? 'text-red-600' : '')}>
                                {fmtDate(invoice.dueDate)}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                                <tr>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Deskripsi</th>
                                    <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Qty</th>
                                    <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Harga</th>
                                    <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {invoice.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-3 py-2.5">{item.description}</td>
                                        <td className="px-3 py-2.5 text-right font-mono">{Number(item.quantity)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unitPrice)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono font-medium">{fmt(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700">
                                <tr>
                                    <td colSpan={3} className="px-3 py-2.5 text-right font-semibold text-sm">Total:</td>
                                    <td className="px-3 py-2.5 text-right font-bold text-base font-mono">{fmt(invoice.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Progress Pelunasan</span>
                            <span className="font-medium">{paidPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${paidPct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={cn('h-full rounded-full', paidPct >= 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Dibayar: <b>{fmt(invoice.paidAmount)}</b></span>
                            <span>Sisa: <b className="text-red-500">{fmt(outstanding)}</b></span>
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Riwayat Pembayaran</h4>
                            <div className="space-y-2">
                                {invoice.payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>{fmtDate(p.date)} · {p.method}</span>
                                            {p.reference && <span className="text-xs text-zinc-400">({p.reference})</span>}
                                        </div>
                                        <span className="font-semibold text-emerald-600 font-mono">{fmt(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {['UNPAID', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && (
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
                        <Button
                            onClick={onPayment}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            <Banknote className="h-4 w-4" />
                            Catat Pembayaran
                        </Button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// =================== MAIN COMPONENT ===================

export function InvoiceManager({ invoices: initialInvoices, accounts, contacts, onRefresh }: InvoiceManagerProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

    const filtered = initialInvoices.filter((inv) => {
        const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
            inv.contact.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalOutstanding = initialInvoices
        .filter((i) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(i.status))
        .reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0);

    const overdueInvoices = initialInvoices.filter((i) => i.status === 'OVERDUE');

    return (
        <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Piutang</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">{fmt(totalOutstanding)}</p>
                    <p className="text-xs text-blue-500 dark:text-blue-600 mt-0.5">{filtered.filter(i => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(i.status)).length} invoice aktif</p>
                </div>
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">Jatuh Tempo</p>
                    </div>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300 font-mono">
                        {fmt(overdueInvoices.reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0))}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-600 mt-0.5">{overdueInvoices.length} invoice overdue</p>
                </div>
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Lunas Bulan Ini</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        {fmt(initialInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0))}
                    </p>
                    <p className="text-xs text-emerald-500 dark:text-emerald-600 mt-0.5">{initialInvoices.filter(i => i.status === 'PAID').length} invoice lunas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Cari invoice atau customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>
                {['ALL', 'UNPAID', 'PARTIAL', 'OVERDUE', 'PAID'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            statusFilter === s
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-brand-300'
                        )}
                    >
                        {s === 'ALL' ? 'Semua' : statusConfig[s as keyof typeof statusConfig]?.label || s}
                    </button>
                ))}
            </div>

            {/* Invoice List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-8 w-8 text-zinc-300 mb-3" />
                    <p className="text-zinc-400 text-sm">Tidak ada invoice yang ditemukan</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {filtered.map((inv) => {
                            const sc = statusConfig[inv.status];
                            const StatusIcon = sc.icon;
                            const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
                            const paidPct = Number(inv.totalAmount) > 0 ? (Number(inv.paidAmount) / Number(inv.totalAmount)) * 100 : 0;

                            return (
                                <motion.div
                                    key={inv.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="group flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all"
                                >
                                    {/* Invoice # and Customer */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{inv.number}</span>
                                            <span className={cn('flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium', sc.color)}>
                                                <StatusIcon className="h-2.5 w-2.5" />{sc.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{inv.contact.name}</p>
                                        <div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden w-32">
                                            <div
                                                className={cn('h-full rounded-full transition-all', paidPct >= 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                                                style={{ width: `${paidPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="hidden md:block text-right space-y-0.5 shrink-0">
                                        <p className="text-xs text-zinc-400">Invoice: {fmtDate(inv.date)}</p>
                                        <p className={cn('text-xs', inv.status === 'OVERDUE' ? 'text-red-500 font-medium' : 'text-zinc-400')}>
                                            Jatuh tempo: {fmtDate(inv.dueDate)}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right shrink-0">
                                        <p className="font-bold font-mono text-sm text-zinc-900 dark:text-zinc-100">{fmt(inv.totalAmount)}</p>
                                        {outstanding > 0 && outstanding < Number(inv.totalAmount) && (
                                            <p className="text-xs text-amber-500">Sisa: {fmt(outstanding)}</p>
                                        )}
                                    </div>

                                    {/* Payment Button */}
                                    {['UNPAID', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); setPayingInvoice(inv); }}
                                            className="shrink-0 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20 hidden sm:flex"
                                        >
                                            <Banknote className="h-3.5 w-3.5" /> Bayar
                                        </Button>
                                    )}
                                    <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-brand-500 transition-colors shrink-0" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedInvoice && (
                    <InvoiceDetail
                        invoice={selectedInvoice}
                        accounts={accounts}
                        onClose={() => setSelectedInvoice(null)}
                        onPayment={() => { setPayingInvoice(selectedInvoice); setSelectedInvoice(null); }}
                    />
                )}
                {payingInvoice && (
                    <PaymentModal
                        invoice={payingInvoice}
                        accounts={accounts}
                        onClose={() => setPayingInvoice(null)}
                        onSuccess={() => { onRefresh?.(); setPayingInvoice(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
