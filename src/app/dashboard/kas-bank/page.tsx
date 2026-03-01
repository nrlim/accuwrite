import { getCashTransactions, getCashAccounts, getAllDetailAccounts } from '@/actions/cash.actions';
import { KasBankPageClient } from './page-client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Kas & Bank — Accuwrite',
    description: 'Pencatatan transaksi kas dan rekonsiliasi bank',
};

export default async function KasBankPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const [cashAccountsRes, allAccountsRes, txRes, contactsRaw] = await Promise.all([
        getCashAccounts(),
        getAllDetailAccounts(),
        getCashTransactions(undefined, 1, 100),
        prisma.contact.findMany({
            where: { tenantId: session.tenantId },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    // Serialize Prisma Decimal → number at server boundary
    const serializeAccounts = (accs: any[]) =>
        accs.map((a) => ({ ...a, initialBalance: Number(a.initialBalance ?? 0) }));

    return (
        <KasBankPageClient
            initialCashAccounts={cashAccountsRes.success ? serializeAccounts(cashAccountsRes.data) : []}
            initialAllAccounts={allAccountsRes.success ? serializeAccounts(allAccountsRes.data) : []}
            initialTransactions={txRes.success ? txRes.data.transactions.map((t: any) => ({
                ...t,
                amount: Number(t.amount),
                date: t.date.toISOString(),
                reconciledAt: t.reconciledAt?.toISOString() ?? null,
            })) : []}
            contacts={contactsRaw}
        />
    );
}

