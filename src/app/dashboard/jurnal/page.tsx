import { getJournalEntries } from '@/actions/journal.actions';
import { getAccountsFlat } from '@/actions/account.actions';
import { getContacts } from '@/actions/invoice.actions';
import { JournalPageClient } from './page-client';
import { Suspense } from 'react';
import { serializeJournalEntry, serializeAccount } from '@/lib/serialize';

export const metadata = {
    title: 'Jurnal Umum | Accuwrite',
    description: 'Kelola entri jurnal double-entry untuk pembukuan Anda',
};

export default async function JournalPage() {
    const [journalResult, accountsResult, contactsResult] = await Promise.all([
        getJournalEntries(1, 30),
        getAccountsFlat(),
        getContacts(),
    ]);

    const entries = journalResult.success
        ? journalResult.data.entries.map(serializeJournalEntry)
        : [];

    const accounts = accountsResult.success
        ? accountsResult.data.map(serializeAccount)
        : [];

    const contacts = contactsResult.success ? contactsResult.data : [];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JournalPageClient
                initialEntries={entries as any}
                accounts={accounts as any}
                contacts={contacts as any}
            />
        </Suspense>
    );
}
