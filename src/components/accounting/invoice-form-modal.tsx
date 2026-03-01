'use client';

import React, { useState, useTransition } from 'react';
import { X, Save, RefreshCw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createInvoice } from '@/actions/invoice.actions';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';
import { Trash2 } from 'lucide-react';

interface Account { id: string; code: string; name: string; type: string; }
interface Contact { id: string; name: string; }

interface InvoiceFormModalProps {
    isOpen: boolean;
    accounts: Account[];
    contacts: Contact[];
    onClose: () => void;
    onSuccess: () => void;
}

interface LineItem {
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
}

const emptyItem = (): LineItem => ({
    description: '',
    quantity: '1',
    unitPrice: '',
    taxRate: '0',
});

export function InvoiceFormModal({ isOpen, accounts, contacts, onClose, onSuccess }: InvoiceFormModalProps) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();

    const [form, setForm] = useState({
        contactId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        arAccountId: '',
        revenueAccountId: '',
    });
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);

    const arAccounts = accounts.filter((a) => a.type === 'ASSET');
    const revenueAccounts = accounts.filter((a) => a.type === 'REVENUE');

    const calcItem = (item: LineItem) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const tax = parseFloat(item.taxRate) || 0;
        const base = qty * price;
        const taxAmt = base * (tax / 100);
        return { base, taxAmt, total: base + taxAmt };
    };

    const subtotal = items.reduce((s, i) => s + calcItem(i).base, 0);
    const totalTax = items.reduce((s, i) => s + calcItem(i).taxAmt, 0);
    const grandTotal = subtotal + totalTax;

    const updateItem = (idx: number, field: keyof LineItem, val: string) => {
        setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            startLoading('Membuat invoice...');
            const result = await createInvoice({
                ...form,
                items: items.map((item) => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    taxRate: parseFloat(item.taxRate) || 0,
                })),
            });
            stopLoading();

            if (result.success) {
                showNotification(result.message, 'success');
                onSuccess();
                onClose();
                setItems([emptyItem()]);
                setForm({ contactId: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '', arAccountId: '', revenueAccountId: '' });
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

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
                        initial={{ scale: 0.93, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 20 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-zinc-200 dark:border-zinc-700"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Buat Invoice Baru</h3>
                                <p className="text-xs text-zinc-500">Invoice akan otomatis memposting jurnal piutang</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Customer & Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Customer *</Label>
                                    <select
                                        value={form.contactId}
                                        onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">— Pilih Customer —</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Tanggal Invoice *</Label>
                                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-sm" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Jatuh Tempo *</Label>
                                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="text-sm" required />
                                </div>
                            </div>

                            {/* Accounting Accounts */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-400">Akun Piutang (Debit) *</Label>
                                    <select
                                        value={form.arAccountId}
                                        onChange={(e) => setForm({ ...form, arAccountId: e.target.value })}
                                        className="w-full text-sm border border-blue-200 dark:border-blue-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">— Pilih Akun Piutang —</option>
                                        {arAccounts.map((a) => (
                                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-400">Akun Pendapatan (Kredit) *</Label>
                                    <select
                                        value={form.revenueAccountId}
                                        onChange={(e) => setForm({ ...form, revenueAccountId: e.target.value })}
                                        className="w-full text-sm border border-blue-200 dark:border-blue-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">— Pilih Akun Pendapatan —</option>
                                        {revenueAccounts.map((a) => (
                                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="col-span-2 text-xs text-blue-500 dark:text-blue-400">
                                    💡 Jurnal otomatis: Debit Piutang – Kredit Pendapatan akan diposting saat invoice dibuat
                                </p>
                            </div>

                            {/* Line Items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Item Invoice</Label>
                                </div>
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                    <div className="grid grid-cols-[1fr_80px_140px_80px_100px_auto] bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                                        {['Deskripsi', 'Qty', 'Harga', 'PPN%', 'Jumlah', ''].map((h) => (
                                            <div key={h} className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">{h}</div>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {items.map((item, idx) => {
                                            const { total } = calcItem(item);
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="grid grid-cols-[1fr_80px_140px_80px_100px_auto] items-center"
                                                >
                                                    <div className="px-2 py-2">
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                            placeholder="Nama barang/jasa..."
                                                            className="text-sm h-8"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="px-2 py-2">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                            className="text-sm h-8 text-right font-mono"
                                                            min="0.01"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div className="px-2 py-2">
                                                        <Input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                                                            placeholder="0"
                                                            className="text-sm h-8 text-right font-mono"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="px-2 py-2">
                                                        <Input
                                                            type="number"
                                                            value={item.taxRate}
                                                            onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                                                            className="text-sm h-8 text-right font-mono"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                    <div className="px-3 py-2 text-sm font-mono font-semibold text-right text-zinc-800 dark:text-zinc-200">
                                                        {total.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                                                    </div>
                                                    <div className="px-2 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => items.length > 1 && setItems((p) => p.filter((_, i) => i !== idx))}
                                                            disabled={items.length <= 1}
                                                            className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={() => setItems((p) => [...p, emptyItem()])}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Tambah Item
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2 text-sm">
                                    <div className="flex justify-between text-zinc-500">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-500">
                                        <span>PPN:</span>
                                        <span className="font-mono">Rp {totalTax.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base border-t border-zinc-200 dark:border-zinc-700 pt-2">
                                        <span>Total:</span>
                                        <span className="font-mono text-brand-600 dark:text-brand-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Catatan</Label>
                                <Input
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Catatan tambahan untuk customer..."
                                    className="text-sm"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                                <Button type="submit" disabled={isPending} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white gap-2">
                                    {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Buat Invoice
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
