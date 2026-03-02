import { AccountType, AccountCategory } from '@prisma/client';

export const COA_TEMPLATES: Record<string, any[]> = {
    umum: [
        { code: '1000', name: 'Bank BCA', type: AccountType.ASSET, category: AccountCategory.DETAIL },
        { code: '1100', name: 'Piutang Usaha', type: AccountType.ASSET, category: AccountCategory.DETAIL },
        { code: '2000', name: 'Hutang Usaha', type: AccountType.LIABILITY, category: AccountCategory.DETAIL },
        { code: '3000', name: 'Modal', type: AccountType.EQUITY, category: AccountCategory.DETAIL },
        { code: '3100', name: 'Laba Ditahan', type: AccountType.EQUITY, category: AccountCategory.DETAIL },
        { code: '4000', name: 'Pendapatan Jasa', type: AccountType.REVENUE, category: AccountCategory.DETAIL },
        { code: '5000', name: 'Beban Operasional', type: AccountType.EXPENSE, category: AccountCategory.DETAIL },
        { code: '5100', name: 'Beban Gaji', type: AccountType.EXPENSE, category: AccountCategory.DETAIL },
    ],
    logistik: [
        { code: '1000', name: 'Bank BCA', type: AccountType.ASSET, category: AccountCategory.DETAIL },
        { code: '1100', name: 'Piutang Logistik', type: AccountType.ASSET, category: AccountCategory.DETAIL },
        { code: '1200', name: 'Persediaan Barang', type: AccountType.ASSET, category: AccountCategory.DETAIL },
        { code: '2000', name: 'Hutang Vendor', type: AccountType.LIABILITY, category: AccountCategory.DETAIL },
        { code: '3000', name: 'Modal', type: AccountType.EQUITY, category: AccountCategory.DETAIL },
        { code: '3100', name: 'Laba Ditahan', type: AccountType.EQUITY, category: AccountCategory.DETAIL },
        { code: '4000', name: 'Pendapatan Pengiriman', type: AccountType.REVENUE, category: AccountCategory.DETAIL },
        { code: '5000', name: 'Beban Operasional', type: AccountType.EXPENSE, category: AccountCategory.DETAIL },
        { code: '5100', name: 'Beban Kendaraan', type: AccountType.EXPENSE, category: AccountCategory.DETAIL },
        { code: '5200', name: 'Beban Gaji Kurir', type: AccountType.EXPENSE, category: AccountCategory.DETAIL },
    ]
};
