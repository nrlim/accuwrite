import { getBills, getAPAgingReport, getContactsForAP } from '@/actions/bill.actions';
import { getCashAccounts, getAllDetailAccounts } from '@/actions/cash.actions';
import { HutangPageClient } from './page-client';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Hutang Usaha (AP) — Accuwrite',
    description: 'Manajemen tagihan vendor dan pembayaran hutang',
};

export default async function HutangPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const [billsRes, agingRes, vendorsRes, allAccountsRes, cashAccountsRes] = await Promise.all([
        getBills(),
        getAPAgingReport(),
        getContactsForAP(),
        getAllDetailAccounts(),
        getCashAccounts(),
    ]);

    // `getBills` return array is already serialized by `deepSerialize` in the Server Action


    const agingData = agingRes.success ? agingRes.data : null;

    const expenseAccounts = allAccountsRes.success
        ? allAccountsRes.data.map((a: any) => ({ ...a, initialBalance: Number(a.initialBalance) }))
        : [];
    const apAccounts = expenseAccounts.filter((a) => a.type === 'LIABILITY');
    const cashAccounts = cashAccountsRes.success
        ? cashAccountsRes.data.map((a) => ({ ...a, initialBalance: Number(a.initialBalance) }))
        : [];

    return (
        <HutangPageClient
            initialBills={billsRes.success ? (billsRes.data as any) : []}
            agingData={agingData}
            vendors={vendorsRes.success ? vendorsRes.data : []}
            expenseAccounts={expenseAccounts}
            apAccounts={apAccounts}
            cashAccounts={cashAccounts}
        />
    );
}
