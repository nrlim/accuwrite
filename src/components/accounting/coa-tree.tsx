'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Scale, Activity, Layers, DollarSign, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { deleteAccount } from '@/actions/account.actions';
import { showNotification } from '@/hooks/use-notification';

// =================== TYPES ===================

export interface Account {
    id: string;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    category: 'HEADER' | 'DETAIL';
    initialBalance: number | string;
    currentBalance?: number | string;
    parentId: string | null;
    description?: string | null;
    children?: Account[];
}

interface COATreeProps {
    accounts: Account[];
    onAdd?: (parentId?: string) => void;
    onEdit?: (account: Account) => void;
    onSetBalance?: (account: Account) => void;
    onRefresh?: () => void;
}

// =================== TYPE CONFIG ===================

const typeConfig = {
    ASSET: {
        label: 'Aset',
        icon: Wallet,
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        textColor: 'text-blue-700 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    },
    LIABILITY: {
        label: 'Kewajiban',
        icon: TrendingDown,
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    },
    EQUITY: {
        label: 'Modal',
        icon: Scale,
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        textColor: 'text-purple-700 dark:text-purple-400',
        borderColor: 'border-purple-200 dark:border-purple-800',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    },
    REVENUE: {
        label: 'Pendapatan',
        icon: TrendingUp,
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    EXPENSE: {
        label: 'Beban',
        icon: Activity,
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
    },
};

// =================== ACCOUNT ROW ===================

function getAccountBalance(acc: Account): number {
    if (acc.category === 'HEADER') {
        if (!acc.children || acc.children.length === 0) return 0;
        return acc.children.reduce((sum, child) => sum + getAccountBalance(child), 0);
    }
    return Number(acc.currentBalance ?? acc.initialBalance);
}

function AccountRow({
    account,
    depth = 0,
    onAdd,
    onEdit,
    onDelete,
    onSetBalance,
}: {
    account: Account;
    depth?: number;
    onAdd?: (parentId?: string) => void;
    onEdit?: (account: Account) => void;
    onDelete?: (account: Account) => void;
    onSetBalance?: (account: Account) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = account.children && account.children.length > 0;
    const isHeader = account.category === 'HEADER';
    const config = typeConfig[account.type];

    const balanceAmount = getAccountBalance(account);

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150',
                    'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                    isHeader && 'font-semibold'
                )}
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
            >
                {/* Expand/Collapse */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                        'w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0',
                        hasChildren ? 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200' : 'text-transparent'
                    )}
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    {hasChildren ? (
                        expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    )}
                </button>

                {/* Account Info */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                    <span className={cn(
                        'text-xs font-mono px-1.5 py-0.5 rounded shrink-0 font-medium',
                        config.badgeColor
                    )}>
                        {account.code}
                    </span>
                    <span className={cn('text-sm truncate', isHeader ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400')}>
                        {account.name}
                    </span>
                    {isHeader && (
                        <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                            <Layers className="h-3 w-3" />
                            Header
                        </span>
                    )}
                </div>

                {/* Balance display */}
                {!isHeader ? (
                    <div className="flex items-center gap-1.5 shrink-0 hidden md:flex">
                        {balanceAmount !== 0 ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                {balanceAmount.toLocaleString('id-ID')}
                            </span>
                        ) : (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600 font-mono">—</span>
                        )}
                    </div>
                ) : (
                    /* Header: show recursive sum of children's balances */
                    account.children && account.children.length > 0 && (() => {
                        return balanceAmount !== 0 ? (
                            <span className="text-xs text-zinc-400 font-mono hidden md:block shrink-0">
                                Rp {balanceAmount.toLocaleString('id-ID')}
                            </span>
                        ) : null;
                    })()
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isHeader && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd?.(account.id); }}
                            className="p-1 rounded text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                            title="Tambah sub-akun"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {!isHeader && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSetBalance?.(account); }}
                            className="p-1 rounded text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                            title="Set Opening Balance"
                        >
                            <DollarSign className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(account); }}
                        className="p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit akun"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(account); }}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Hapus akun"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </motion.div>

            {/* Children */}
            {hasChildren && (
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {account.children!.map((child) => (
                                <AccountRow
                                    key={child.id}
                                    account={child}
                                    depth={depth + 1}
                                    onAdd={onAdd}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onSetBalance={onSetBalance}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

// =================== TYPE SECTION ===================

function TypeSection({
    type,
    accounts,
    onAdd,
    onEdit,
    onDelete,
    onSetBalance,
}: {
    type: keyof typeof typeConfig;
    accounts: Account[];
    onAdd?: (parentId?: string) => void;
    onEdit?: (account: Account) => void;
    onDelete?: (account: Account) => void;
    onSetBalance?: (account: Account) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const config = typeConfig[type];
    const Icon = config.icon;
    const totalAccounts = countAllAccounts(accounts);

    function countAllAccounts(accs: Account[]): number {
        let count = 0;
        for (const acc of accs) {
            count++;
            if (acc.children) count += countAllAccounts(acc.children);
        }
        return count;
    }

    if (accounts.length === 0) return null;

    return (
        <div className={cn('rounded-xl border overflow-hidden mb-3', config.borderColor)}>
            {/* Section Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                    config.bgColor,
                    'hover:brightness-95'
                )}
            >
                <Icon className={cn('h-4 w-4 shrink-0', config.textColor)} />
                <span className={cn('text-sm font-bold flex-1 text-left', config.textColor)}>
                    {config.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {totalAccounts} akun
                </span>
                {expanded ? (
                    <ChevronDown className={cn('h-4 w-4', config.textColor)} />
                ) : (
                    <ChevronRight className={cn('h-4 w-4', config.textColor)} />
                )}
            </button>

            {/* Account Rows */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="divide-y divide-zinc-100 dark:divide-zinc-800/60"
                    >
                        {accounts.map((account) => (
                            <AccountRow
                                key={account.id}
                                account={account}
                                depth={0}
                                onAdd={onAdd}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onSetBalance={onSetBalance}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =================== MAIN COA TREE ===================

export function COATree({ accounts, onAdd, onEdit, onSetBalance, onRefresh }: COATreeProps) {
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Build tree structure
    const buildTree = useCallback((accs: Account[]): Account[] => {
        const map = new Map<string, Account>();
        const roots: Account[] = [];

        accs.forEach((acc) => map.set(acc.id, { ...acc, children: [] }));

        map.forEach((acc) => {
            if (acc.parentId && map.has(acc.parentId)) {
                map.get(acc.parentId)!.children!.push(acc);
            } else {
                roots.push(acc);
            }
        });

        return roots;
    }, []);

    // Group by type
    const tree = buildTree(accounts);
    const types: Array<keyof typeof typeConfig> = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    const grouped = types.reduce((acc, type) => {
        acc[type] = tree.filter((a) => a.type === type);
        return acc;
    }, {} as Record<string, Account[]>);

    const handleDelete = (account: Account) => {
        setDeletingId(account.id);
        startTransition(async () => {
            const { deleteAccount: del } = await import('@/actions/account.actions');
            const result = await del(account.id);
            if (result.success) {
                showNotification(result.message, 'success');
                onRefresh?.();
            } else {
                showNotification(result.error, 'error');
            }
            setDeletingId(null);
        });
    };

    if (accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Wallet className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Belum ada bagan akun. Mulai tambahkan akun pertama Anda.</p>
                <Button onClick={() => onAdd?.()} className="mt-4 gap-2" size="sm">
                    <Plus className="h-4 w-4" /> Tambah Akun
                </Button>
            </div>
        );
    }

    return (
        <div>
            {types.map((type) => (
                <TypeSection
                    key={type}
                    type={type}
                    accounts={grouped[type] || []}
                    onAdd={onAdd}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    onSetBalance={onSetBalance}
                />
            ))}
        </div>
    );
}
