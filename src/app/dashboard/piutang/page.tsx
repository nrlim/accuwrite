import { getInvoices, getAgingReport, getContacts } from '@/actions/invoice.actions';
import { getAccountsFlat } from '@/actions/account.actions';
import { ARPageClient } from './page-client';
import { Suspense } from 'react';

export const metadata = {
    title: 'Piutang (AR) | Accuwrite',
    description: 'Kelola piutang, invoice, dan aging report Anda',
};

function serializeAccount(a: any) {
    return { ...a, initialBalance: Number(a.initialBalance ?? 0) };
}

function serializeInvoice(inv: any) {
    return {
        ...inv,
        subtotal: Number(inv.subtotal ?? 0),
        taxAmount: Number(inv.taxAmount ?? 0),
        totalAmount: Number(inv.totalAmount ?? 0),
        paidAmount: Number(inv.paidAmount ?? 0),
        date: inv.date instanceof Date ? inv.date.toISOString() : inv.date,
        dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString() : inv.dueDate,
        items: (inv.items ?? []).map((i: any) => ({
            ...i,
            quantity: Number(i.quantity ?? 0),
            unitPrice: Number(i.unitPrice ?? 0),
            taxRate: Number(i.taxRate ?? 0),
            amount: Number(i.amount ?? 0),
        })),
        payments: (inv.payments ?? []).map((p: any) => ({
            ...p,
            amount: Number(p.amount ?? 0),
            date: p.date instanceof Date ? p.date.toISOString() : p.date,
        })),
    };
}

export default async function ARPage() {
    const [invoiceResult, agingResult, accountsResult, contactsResult] = await Promise.all([
        getInvoices(),
        getAgingReport(),
        getAccountsFlat(),
        getContacts('CUSTOMER'),
    ]);

    const invoices = invoiceResult.success
        ? invoiceResult.data.map(serializeInvoice)
        : [];

    const accounts = accountsResult.success
        ? accountsResult.data.map(serializeAccount)
        : [];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ARPageClient
                initialInvoices={invoices as any}
                agingSummary={(agingResult.success ? agingResult.data.summary : {
                    current: { count: 0, total: 0 },
                    '1-30': { count: 0, total: 0 },
                    '31-60': { count: 0, total: 0 },
                    '61-90': { count: 0, total: 0 },
                    '91+': { count: 0, total: 0 },
                }) as any}
                accounts={accounts as any}
                contacts={(contactsResult.success ? contactsResult.data : []) as any}
            />
        </Suspense>
    );
}
