'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAccount, updateAccount, getNextAvailableCode } from '@/actions/account.actions';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';
import type { Account } from './coa-tree';

interface AccountFormModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    account?: Account | null;
    parentId?: string | null;
    allAccounts: Account[];
    onClose: () => void;
    onSuccess: () => void;
}

const ACCOUNT_TYPES = [
    { value: 'ASSET', label: 'Aset' },
    { value: 'LIABILITY', label: 'Kewajiban' },
    { value: 'EQUITY', label: 'Modal' },
    { value: 'REVENUE', label: 'Pendapatan' },
    { value: 'EXPENSE', label: 'Beban' },
] as const;

export function AccountFormModal({
    isOpen,
    mode,
    account,
    parentId,
    allAccounts,
    onClose,
    onSuccess,
}: AccountFormModalProps) {
    const [isPending, startTransition] = useTransition();
    const { startLoading, stopLoading } = useLoading();
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    const [form, setForm] = useState({
        code: '',
        name: '',
        type: 'ASSET' as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
        category: 'DETAIL' as 'HEADER' | 'DETAIL',
        parentId: parentId || '',
        initialBalance: '0',
        description: '',
    });

    useEffect(() => {
        if (mode === 'edit' && account) {
            setForm({
                code: account.code,
                name: account.name,
                type: account.type,
                category: account.category,
                parentId: account.parentId || '',
                initialBalance: String(Number(account.initialBalance)),
                description: account.description || '',
            });
        } else {
            setForm({
                code: '',
                name: '',
                type: 'ASSET',
                category: 'DETAIL',
                parentId: parentId || '',
                initialBalance: '0',
                description: '',
            });
        }
    }, [mode, account, parentId, isOpen]);

    useEffect(() => {
        if (mode === 'create' && isOpen) {
            let mounted = true;
            const fetchNextCode = async () => {
                setIsAutoGenerating(true);
                const result = await getNextAvailableCode(form.type);
                if (mounted && result.success) {
                    setForm((prev) => ({ ...prev, code: result.data.code }));
                }
                if (mounted) setIsAutoGenerating(false);
            };
            fetchNextCode();
            return () => {
                mounted = false;
            };
        }
    }, [form.type, mode, isOpen]);

    const headerAccounts = allAccounts.filter((a) => a.category === 'HEADER');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            startLoading(mode === 'create' ? 'Membuat akun...' : 'Memperbarui akun...');
            const payload = {
                ...form,
                parentId: form.parentId || null,
                initialBalance: parseFloat(form.initialBalance) || 0,
            };
            const result =
                mode === 'create'
                    ? await createAccount(payload)
                    : await updateAccount(account!.id, payload);
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
                        initial={{ scale: 0.93, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 16 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-700"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {mode === 'create' ? 'Tambah Akun Baru' : 'Edit Akun'}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {mode === 'create' ? 'Isi detail akun untuk Bagan Akun' : `Mengedit: ${account?.name}`}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Code & Name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="acc-code" className="text-xs font-medium">
                                        Kode Akun *
                                        {isAutoGenerating && <span className="text-zinc-400 ml-2 animate-pulse">(Generating...)</span>}
                                    </Label>
                                    <Input
                                        id="acc-code"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="1000"
                                        className="font-mono text-sm"
                                        disabled={isAutoGenerating}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="acc-name" className="text-xs font-medium">Nama Akun *</Label>
                                    <Input
                                        id="acc-name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Kas"
                                        className="text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Type & Category */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Jenis Akun *</Label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        {ACCOUNT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Kategori *</Label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="DETAIL">Detail (Postable)</option>
                                        <option value="HEADER">Header (Induk)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Parent & Balance */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Akun Induk</Label>
                                    <select
                                        value={form.parentId}
                                        onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                                        className="w-full text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">— Tidak Ada —</option>
                                        {headerAccounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.code} – {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {form.category === 'DETAIL' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="acc-balance" className="text-xs font-medium">Saldo Awal (Rp)</Label>
                                        <Input
                                            id="acc-balance"
                                            type="number"
                                            value={form.initialBalance}
                                            onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                                            placeholder="0"
                                            className="text-sm font-mono"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="acc-desc" className="text-xs font-medium">Deskripsi</Label>
                                <Input
                                    id="acc-desc"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Keterangan tambahan..."
                                    className="text-sm"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white gap-2"
                                >
                                    {isPending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {mode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
