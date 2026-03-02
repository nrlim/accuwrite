import { Role } from '@prisma/client';

export const defaultRolePermissions: Record<Role, string[]> = {
    OWNER: ['/dashboard', '/dashboard/bagan-akun', '/dashboard/jurnal', '/dashboard/kas-bank', '/dashboard/buku-besar', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak', '/dashboard/laporan', '/dashboard/settings/users', '/dashboard/settings/permissions', '/dashboard/settings/integrations'],
    ADMIN: ['/dashboard', '/dashboard/bagan-akun', '/dashboard/jurnal', '/dashboard/kas-bank', '/dashboard/buku-besar', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak', '/dashboard/laporan', '/dashboard/settings/users', '/dashboard/settings/permissions', '/dashboard/settings/integrations'],
    MANAGER: ['/dashboard', '/dashboard/bagan-akun', '/dashboard/jurnal', '/dashboard/kas-bank', '/dashboard/buku-besar', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak', '/dashboard/laporan'],
    ACCOUNTANT: ['/dashboard', '/dashboard/bagan-akun', '/dashboard/jurnal', '/dashboard/kas-bank', '/dashboard/buku-besar', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak', '/dashboard/laporan'],
    AUDITOR: ['/dashboard', '/dashboard/bagan-akun', '/dashboard/jurnal', '/dashboard/kas-bank', '/dashboard/buku-besar', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak', '/dashboard/laporan'],
    STAFF: ['/dashboard', '/dashboard/piutang', '/dashboard/hutang', '/dashboard/kontak'],
};
