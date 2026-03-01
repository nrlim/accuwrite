'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
    Plus, Search, User, Building2, Users, RefreshCw,
    Pencil, Trash2, CheckCircle2, Phone, Mail, MapPin, X, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createContact, type ContactFormData } from '@/actions/invoice.actions';
import { updateContact, deleteContact, getAllContacts } from '@/actions/bill.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

interface Contact {
    id: string;
    name: string;
    type: 'CUSTOMER' | 'VENDOR' | 'BOTH';
    email: string | null;
    phone: string | null;
    address: string | null;
    npwp: string | null;
    createdAt: string;
    _count: { invoices: number; bills: number };
}

interface KontakPageClientProps {
    initialContacts: Contact[];
}

const typeConfig = {
    CUSTOMER: { label: 'Pelanggan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: User },
    VENDOR: { label: 'Vendor', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Building2 },
    BOTH: { label: 'Keduanya', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Users },
};

// =================== CONTACT FORM ===================

function ContactFormModal({
    isOpen,
    contact,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    contact?: Contact | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!contact;
    const [form, setForm] = useState({
        name: contact?.name ?? '',
        type: contact?.type ?? 'CUSTOMER',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        address: contact?.address ?? '',
        npwp: contact?.npwp ?? '',
    });

    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = isEdit && contact
                ? await updateContact(contact.id, { ...form, type: form.type })
                : await createContact(form as ContactFormData);

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
                        initial={{ scale: 0.95, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 12 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                                {isEdit ? 'Edit Kontak' : 'Tambah Kontak Baru'}
                            </h3>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Type toggle */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Tipe Kontak *</Label>
                                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                                    {(['CUSTOMER', 'VENDOR', 'BOTH'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => set('type', t)}
                                            className={cn(
                                                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                                form.type === t
                                                    ? t === 'CUSTOMER'
                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                        : t === 'VENDOR'
                                                            ? 'bg-orange-500 text-white shadow-sm'
                                                            : 'bg-purple-500 text-white shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-700'
                                            )}
                                        >
                                            {typeConfig[t].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Nama *</Label>
                                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nama perusahaan atau individu" className="text-sm" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@domain.com" className="text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> Telepon</Label>
                                    <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08xxx" className="text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Alamat</Label>
                                <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Alamat lengkap" className="text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">NPWP</Label>
                                <Input value={form.npwp} onChange={(e) => set('npwp', e.target.value)} placeholder="00.000.000.0-000.000" className="text-sm font-mono" />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                                <Button type="submit" disabled={isPending} className="flex-1 gap-2">
                                    {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Kontak'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// =================== CONTACT CARD ===================

function ContactCard({ contact, onEdit, onDelete }: {
    contact: Contact;
    onEdit: (c: Contact) => void;
    onDelete: (c: Contact) => void;
}) {
    const cfg = typeConfig[contact.type];
    const TypeIcon = cfg.icon;
    const totalTx = contact._count.invoices + contact._count.bills;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow"
        >
            {/* Avatar */}
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.color)}>
                <TypeIcon className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{contact.name}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
                        {cfg.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400">
                    {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                    {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                    {contact.npwp && <span className="font-mono">{contact.npwp}</span>}
                </div>
                {contact.address && (
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.address}</span>
                    </p>
                )}
                {totalTx > 0 && (
                    <div className="flex gap-3 mt-2 text-xs">
                        {contact._count.invoices > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-3 w-3" /> {contact._count.invoices} invoice
                            </span>
                        )}
                        {contact._count.bills > 0 && (
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                <CheckCircle2 className="h-3 w-3" /> {contact._count.bills} tagihan
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(contact)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit kontak"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => onDelete(contact)}
                    disabled={totalTx > 0}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={totalTx > 0 ? 'Kontak memiliki transaksi — tidak bisa dihapus' : 'Hapus kontak'}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
}

// =================== MAIN ===================

export function KontakPageClient({ initialContacts }: KontakPageClientProps) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [isPending, startTransition] = useTransition();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'VENDOR' | 'BOTH'>('ALL');
    const [formOpen, setFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const res = await getAllContacts();
        if (res.success) {
            setContacts(res.data.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt).toISOString(),
                updatedAt: new Date(c.updatedAt).toISOString(),
            })));
        }
        setIsRefreshing(false);
    }, []);

    const handleDelete = (contact: Contact) => {
        if (!confirm(`Hapus kontak "${contact.name}"?`)) return;
        startTransition(async () => {
            const r = await deleteContact(contact.id);
            if (r.success) { showNotification(r.message, 'success'); refresh(); }
            else showNotification(r.error, 'error');
        });
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormOpen(true);
    };

    const filtered = contacts.filter((c) => {
        const matchType = filterType === 'ALL' || c.type === filterType;
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search);
        return matchType && matchSearch;
    });

    const customerCount = contacts.filter((c) => ['CUSTOMER', 'BOTH'].includes(c.type)).length;
    const vendorCount = contacts.filter((c) => ['VENDOR', 'BOTH'].includes(c.type)).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users className="h-6 w-6 text-brand-600" />
                        Manajemen Kontak
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {contacts.length} kontak · {customerCount} pelanggan · {vendorCount} vendor
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing} className="gap-2">
                        <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => { setEditingContact(null); setFormOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Kontak
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Pelanggan', count: customerCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Vendor', count: vendorCount, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { label: 'Total', count: contacts.length, color: 'text-zinc-700 dark:text-zinc-300', bg: 'bg-zinc-50 dark:bg-zinc-800' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} className={cn('rounded-xl p-4 text-center', bg)}>
                        <p className={cn('text-2xl font-bold', color)}>{count}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filter + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                    {(['ALL', 'CUSTOMER', 'VENDOR', 'BOTH'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                filterType === t
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                            )}
                        >
                            {t === 'ALL' ? 'Semua' : typeConfig[t].label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Cari nama, email, atau nomor HP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>
            </div>

            {/* Contact Grid */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <Users className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">
                        {search ? 'Tidak ditemukan kontak yang sesuai' : 'Belum ada kontak. Tambahkan yang pertama!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                        {filtered.map((c) => (
                            <ContactCard
                                key={c.id}
                                contact={c}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Contact Form Modal */}
            <ContactFormModal
                isOpen={formOpen}
                contact={editingContact}
                onClose={() => { setFormOpen(false); setEditingContact(null); }}
                onSuccess={refresh}
            />
        </div>
    );
}
