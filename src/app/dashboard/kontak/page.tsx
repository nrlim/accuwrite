import { getAllContacts } from '@/actions/bill.actions';
import { createContact } from '@/actions/invoice.actions';
import { KontakPageClient } from './page-client';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Manajemen Kontak — Accuwrite',
    description: 'Kelola pelanggan dan vendor',
};

export default async function KontakPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const res = await getAllContacts();
    const contacts = res.success
        ? res.data.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            _count: c._count,
        }))
        : [];

    return <KontakPageClient initialContacts={contacts} />;
}
