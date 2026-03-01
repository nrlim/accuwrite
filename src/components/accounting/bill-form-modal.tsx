'use client';

import React, { useState, useTransition } from 'react';
import {
    X, Plus, Trash2, RefreshCw, Receipt, Building2, Calculator,
    ChevronDown, ChevronUp, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createBill, type CreateBillData } from '@/actions/bill.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

interface Account { id: string; code: string; name: string; type: string; }
interface Contact { id: string; name: string; }

interface BillFormModalProps {
    isOpen: boolean;
    vendors: Contact[];
    expenseAccounts: Account[];  // EXPENSE type accounts
    apAccounts: Account[];       // LIABILITY type accounts (AP)
    onClose: () => void;
    onSuccess: () => void;
}

interface BillLineItem {
    id: string;
    description: string;
    accountId: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
}

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

// =================== COMPONENT ===================

export function BillFormModal({
    isOpen,
    vendors,
    expenseAccounts,
    apAccounts,
    onClose,
    onSuccess,
}: BillFormModalProps) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        contactId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        apAccountId: apAccounts[0]?.id ?? '',
    });

    const [items, setItems] = useState<BillLineItem[]>([
        { id: '1', description: '', accountId: expenseAccounts[0]?.id ?? '', quantity: '1', unitPrice: '', taxRate: '0' },
    ]);

    const [showAccounts, setShowAccounts] = useState(false);

    const setForm_ = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

    const updateItem = (id: string, key: keyof BillLineItem, val: string) =>
        setItems((p) => p.map((it) => (it.id === id ? { ...it, [key]: val } : it)));

    const addItem = () =>
        setItems((p) => [
            ...p,
            { id: String(Date.now()), description: '', accountId: expenseAccounts[0]?.id ?? '', quantity: '1', unitPrice: '', taxRate: '0' },
        ]);

    const removeItem = (id: string) =>
        setItems((p) => p.filter((it) => it.id !== id));

    // Calculations
    const computedItems = items.map((it) => {
        const q = parseFloat(it.quantity) || 0;
        const p = parseFloat(it.unitPrice) || 0;
        const t = parseFloat(it.taxRate) || 0;
        const base = q * p;
        const tax = base * (t / 100);
        return { ...it, base, tax, total: base + tax };
    });
    const subtotal = computedItems.reduce((s, i) => s + i.base, 0);
    const totalTax = computedItems.reduce((s, i) => s + i.tax, 0);
    const grandTotal = subtotal + totalTax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await createBill({
                contactId: form.contactId,
                date: form.date,
                dueDate: form.dueDate,
                notes: form.notes || null,
                apAccountId: form.apAccountId,
                items: computedItems.map((it) => ({
                    description: it.description,
                    accountId: it.accountId,
                    quantity: parseFloat(it.quantity) || 1,
                    unitPrice: parseFloat(it.unitPrice) || 0,
                    taxRate: parseFloat(it.taxRate) || 0,
                })),
            } satisfies CreateBillData);

            if (result.success) {
                showNotification(result.message, 'success');
                onSuccess();
                onClose();
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

    const typeLabel: Record<string, string> = {
        ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Modal', REVENUE: 'Pendapatan', EXPENSE: 'Beban',
    };

    const groupedExpenseAccounts = (['EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE'] as const).reduce(
        (acc, type) => { acc[type] = expenseAccounts.filter((a) => a.type === type); return acc; },
        {} as Record<string, Account[]>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.94, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.94, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-zinc-200 dark:border-zinc-700 my-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-t-2xl">
                            <div>
                                <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-orange-600" />
                                    Buat Tagihan (Bill)
                                </h2>
                                <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                                    💡 Jurnal otomatis: Debit Beban → Kredit Hutang Usaha
                                </p>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-5">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <Building2 className="h-3 w-3" /> Vendor *
                                    </Label>
                                    <select
                                        value={form.contactId}
                                        onChange={(e) => setForm_('contactId', e.target.value)}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    >
                                        <option value="">— Pilih Vendor —</option>
                                        {vendors.map((v) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Tanggal Tagihan *</Label>
                                    <Input type="date" value={form.date} onChange={(e) => setForm_('date', e.target.value)} className="text-sm" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Jatuh Tempo *</Label>
                                    <Input type="date" value={form.dueDate} onChange={(e) => setForm_('dueDate', e.target.value)} className="text-sm" required />
                                </div>
                            </div>

                            {/* AP Account */}
                            <div className="space-y-1.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAccounts(!showAccounts)}
                                    className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-600 transition-colors"
                                >
                                    <Receipt className="h-3.5 w-3.5" />
                                    Akun Hutang Usaha (AP)
                                    {showAccounts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                                <AnimatePresence>
                                    {showAccounts && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <select
                                                value={form.apAccountId}
                                                onChange={(e) => setForm_('apAccountId', e.target.value)}
                                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                required
                                            >
                                                <option value="">— Pilih Akun Hutang —</option>
                                                {apAccounts.map((a) => (
                                                    <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Item Tagihan *</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addItem} className="text-xs gap-1 h-7">
                                        <Plus className="h-3 w-3" /> Tambah Baris
                                    </Button>
                                </div>

                                {/* Header row */}
                                <div className="grid grid-cols-[1fr_150px_80px_90px_60px_28px] gap-2 px-2 text-[10px] font-semibold text-zinc-400 uppercase">
                                    <span>Deskripsi & Akun</span>
                                    <span>Akun Beban</span>
                                    <span>Qty</span>
                                    <span>Harga</span>
                                    <span>PPN %</span>
                                    <span></span>
                                </div>

                                <div className="space-y-2">
                                    {computedItems.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="grid grid-cols-[1fr_150px_80px_90px_60px_28px] gap-2 items-start"
                                        >
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                placeholder="Deskripsi item..."
                                                className="text-sm h-8"
                                                required
                                            />
                                            <select
                                                value={item.accountId}
                                                onChange={(e) => updateItem(item.id, 'accountId', e.target.value)}
                                                className="h-8 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                required
                                            >
                                                {Object.entries(groupedExpenseAccounts).map(([type, accs]) =>
                                                    accs.length > 0 ? (
                                                        <optgroup key={type} label={typeLabel[type]}>
                                                            {accs.map((a) => (
                                                                <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ) : null
                                                )}
                                            </select>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                min="0.01" step="any"
                                                className="text-sm h-8 text-right font-mono"
                                                required
                                            />
                                            <Input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                placeholder="0"
                                                min="0" step="any"
                                                className="text-sm h-8 text-right font-mono"
                                                required
                                            />
                                            <Input
                                                type="number"
                                                value={item.taxRate}
                                                onChange={(e) => updateItem(item.id, 'taxRate', e.target.value)}
                                                min="0" max="100"
                                                className="text-sm h-8 text-right font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                disabled={items.length === 1}
                                                className="h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-56 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-zinc-500">
                                        <span>Subtotal</span>
                                        <span className="font-mono">Rp {fmt(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-500">
                                        <span>PPN</span>
                                        <span className="font-mono">Rp {fmt(totalTax)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                                        <span>Total Tagihan</span>
                                        <span className="font-mono text-orange-600 dark:text-orange-400">
                                            Rp {fmt(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Catatan</Label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm_('notes', e.target.value)}
                                    placeholder="Catatan tambahan..."
                                    rows={2}
                                    className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                                <Button
                                    type="submit"
                                    disabled={isPending || grandTotal <= 0}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2"
                                >
                                    {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                    Simpan Tagihan
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
