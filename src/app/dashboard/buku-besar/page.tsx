import { getDetailAccounts } from '@/actions/reports.actions';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { BukuBesarPageClient } from './page-client';

export const metadata = {
    title: 'Buku Besar — Accuwrite',
    description: 'General Ledger — Riwayat transaksi per akun dengan saldo berjalan',
};

export default async function BukuBesarPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const res = await getDetailAccounts();
    const accounts = res.success ? res.data : [];

    return <BukuBesarPageClient accounts={accounts} />;
}
