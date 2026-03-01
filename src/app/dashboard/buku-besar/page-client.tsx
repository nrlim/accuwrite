'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import { GeneralLedger } from '@/components/accounting/general-ledger';

interface Account { id: string; code: string; name: string; type: string; }

export function BukuBesarPageClient({ accounts }: { accounts: Account[] }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-brand-600" />
                    Buku Besar
                </h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                    General Ledger · Riwayat transaksi per akun dengan saldo berjalan
                </p>
            </div>
            <GeneralLedger accounts={accounts} />
        </div>
    );
}
