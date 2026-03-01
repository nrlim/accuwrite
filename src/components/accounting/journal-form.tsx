'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, AlertCircle, CheckCircle2, ArrowUpDown, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createJournalEntry } from '@/actions/journal.actions';
import { showNotification } from '@/hooks/use-notification';
import { useLoading } from '@/hooks/use-loading';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface Contact {
    id: string;
    name: string;
}

interface JournalFormProps {
    accounts: Account[];
    contacts?: Contact[];
    onSuccess?: () => void;
}

interface JournalItemForm {
    accountId: string;
    contactId?: string;
    debit: string;
    credit: string;
    memo: string;
}

interface JournalForm {
    date: string;
    reference: string;
    description: string;
    items: JournalItemForm[];
}

const emptyItem = (): JournalItemForm => ({
    accountId: '',
    contactId: '',
    debit: '',
    credit: '',
    memo: '',
});

export function JournalForm({ accounts, contacts = [], onSuccess }: JournalFormProps) {
    const { startLoading, stopLoading } = useLoading();
    const [isPending, startTransition] = useTransition();

    const { control, register, handleSubmit, watch, reset, setValue } = useForm<JournalForm>({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            reference: '',
            description: '',
            items: [emptyItem(), emptyItem()],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const watchedItems = watch('items');

    // Real-time balance indicator
    const totalDebit = watchedItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = watchedItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.001 && totalDebit > 0;

    const onSubmit = (data: JournalForm) => {
        startTransition(async () => {
            startLoading('Memposting jurnal...');
            const result = await createJournalEntry({
                date: data.date,
                reference: data.reference,
                description: data.description,
                items: data.items.map((item) => ({
                    accountId: item.accountId,
                    contactId: item.contactId || null,
                    debit: parseFloat(item.debit) || 0,
                    credit: parseFloat(item.credit) || 0,
                    memo: item.memo || null,
                })),
            });
            stopLoading();

            if (result.success) {
                showNotification(result.message, 'success');
                reset();
                onSuccess?.();
            } else {
                showNotification(result.error, 'error');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="jv-date" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tanggal *</Label>
                    <Input
                        id="jv-date"
                        type="date"
                        {...register('date', { required: true })}
                        className="text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="jv-reference" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Referensi *</Label>
                    <Input
                        id="jv-reference"
                        placeholder="JV-2024-001"
                        {...register('reference', { required: true })}
                        className="text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="jv-desc" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Deskripsi *</Label>
                    <Input
                        id="jv-desc"
                        placeholder="Keterangan jurnal..."
                        {...register('description', { required: true })}
                        className="text-sm"
                    />
                </div>
            </div>

            {/* Balance Indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={isBalanced ? 'balanced' : 'unbalanced'}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-2.5 border transition-all',
                        isBalanced
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : totalDebit > 0 || totalCredit > 0
                                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                                : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700'
                    )}
                >
                    {isBalanced ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle className={cn('h-4 w-4 shrink-0',
                            totalDebit > 0 || totalCredit > 0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-400'
                        )} />
                    )}

                    <div className="flex items-center gap-6 flex-1 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-500">Total Debit:</span>
                            <span className="font-semibold font-mono text-blue-600 dark:text-blue-400">
                                Rp {totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </span>
                        </span>
                        <ArrowUpDown className="h-3 w-3 text-zinc-300" />
                        <span className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-500">Total Kredit:</span>
                            <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                                Rp {totalCredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </span>
                        </span>
                    </div>

                    <span className={cn('text-xs font-medium',
                        isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}>
                        {isBalanced ? 'Seimbang ✓' : difference > 0 ? `Selisih: Rp ${difference.toLocaleString('id-ID', { minimumFractionDigits: 2 })}` : 'Belum ada entri'}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* Journal Items */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_180px_160px_160px_auto] gap-0 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                    {['Akun', 'Memo', 'Debit (Rp)', 'Kredit (Rp)', ''].map((h, i) => (
                        <div key={i} className="px-3 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {h}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <AnimatePresence>
                        {fields.map((field, index) => (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="grid grid-cols-[1fr_180px_160px_160px_auto] gap-0 items-center"
                            >
                                {/* Account Select */}
                                <div className="px-2 py-2">
                                    <Controller
                                        name={`items.${index}.accountId`}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field: f }) => (
                                            <select
                                                {...f}
                                                className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900"
                                                aria-label={`Akun baris ${index + 1}`}
                                            >
                                                <option value="">— Pilih Akun —</option>
                                                {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((type) => {
                                                    const typeAccounts = accounts.filter((a) => a.type === type);
                                                    if (typeAccounts.length === 0) return null;
                                                    return (
                                                        <optgroup key={type} label={type}>
                                                            {typeAccounts.map((acc) => (
                                                                <option key={acc.id} value={acc.id}>
                                                                    {acc.code} – {acc.name}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    />
                                </div>

                                {/* Memo */}
                                <div className="px-2 py-2">
                                    <Input
                                        {...register(`items.${index}.memo`)}
                                        placeholder="Keterangan..."
                                        className="text-sm h-9"
                                    />
                                </div>

                                {/* Debit */}
                                <div className="px-2 py-2">
                                    <Input
                                        {...register(`items.${index}.debit`)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="text-sm h-9 font-mono text-right"
                                        onChange={(e) => {
                                            if (e.target.value && watchedItems[index]?.credit) {
                                                setValue(`items.${index}.credit`, '');
                                            }
                                            register(`items.${index}.debit`).onChange(e);
                                        }}
                                    />
                                </div>

                                {/* Credit */}
                                <div className="px-2 py-2">
                                    <Input
                                        {...register(`items.${index}.credit`)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="text-sm h-9 font-mono text-right"
                                        onChange={(e) => {
                                            if (e.target.value && watchedItems[index]?.debit) {
                                                setValue(`items.${index}.debit`, '');
                                            }
                                            register(`items.${index}.credit`).onChange(e);
                                        }}
                                    />
                                </div>

                                {/* Remove */}
                                <div className="px-2 py-2">
                                    <button
                                        type="button"
                                        onClick={() => fields.length > 2 && remove(index)}
                                        disabled={fields.length <= 2}
                                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Hapus baris"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add Row */}
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => append(emptyItem())}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors font-medium"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Baris
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => reset()}
                    className="gap-2"
                >
                    <RefreshCw className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button
                    type="submit"
                    disabled={isPending || !isBalanced}
                    className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                >
                    {isPending ? (
                        <span className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" /> Memposting...
                        </span>
                    ) : (
                        <>
                            <Save className="h-4 w-4" /> Posting Jurnal
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
