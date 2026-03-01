import { getDashboardStats } from '@/actions/dashboard.actions';
import { DashboardPageClient } from './page-client';
import { Suspense } from 'react';

export const metadata = {
    title: 'Dashboard | Accuwrite',
    description: 'Ringkasan keuangan bisnis Anda',
};

export default async function DashboardPage() {
    const statsResult = await getDashboardStats();
    const stats = statsResult.success ? statsResult.data : null;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardPageClient stats={stats as any} />
        </Suspense>
    );
}
