import { getProfitLossReport, getBalanceSheet } from '@/actions/reports.actions';
import { LaporanPageClient } from './page-client';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Laporan Keuangan — Accuwrite',
    description: 'Laporan Laba Rugi dan Neraca Keuangan',
};

export default async function LaporanPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    // Default: current month for P&L, today for Balance Sheet
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = now.toISOString().split('T')[0];

    const [plRes, bsRes] = await Promise.all([
        getProfitLossReport(startDate, endDate),
        getBalanceSheet(endDate),
    ]);

    return (
        <LaporanPageClient
            initialPL={plRes.success ? plRes.data : null}
            initialBS={bsRes.success ? bsRes.data : null}
            defaultStartDate={startDate}
            defaultEndDate={endDate}
        />
    );
}
