import React, { Suspense } from 'react';
import { getAccounts } from '@/actions/account.actions';
import { getSession } from '@/lib/session';
import { COAPageClient } from './page-client';

export const metadata = {
    title: 'Bagan Akun | Accuwrite',
    description: 'Kelola Chart of Accounts untuk laporan keuangan Anda',
};

/** Recursively convert Prisma Decimal → plain Number so Next.js can
 *  serialise the value across the Server → Client Component boundary. */
function serializeAccount(acc: any): any {
    return {
        ...acc,
        initialBalance: Number(acc.initialBalance ?? 0),
        children: Array.isArray(acc.children)
            ? acc.children.map(serializeAccount)
            : [],
        // strip non-serialisable parent reference (causes circular issues)
        parent: acc.parent
            ? { id: acc.parent.id, name: acc.parent.name, code: acc.parent.code }
            : null,
    };
}

export default async function COAPage() {
    const session = await getSession();
    if (!session) return null;

    const result = await getAccounts();
    const accounts = result.success
        ? result.data.map(serializeAccount)
        : [];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <COAPageClient initialAccounts={accounts as any} tenantId={session.tenantId} />
        </Suspense>
    );
}
