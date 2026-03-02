'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { defaultRolePermissions } from '@/lib/constants';

export async function getRolePermissions() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized', permissions: {} as Record<Role, string[]> };

        const perms = await prisma.rolePermission.findMany({
            where: { tenantId: session.tenantId },
        });

        const currentPermissions: Record<Role, string[]> = { ...defaultRolePermissions };
        for (const perm of perms) {
            currentPermissions[perm.role as Role] = JSON.parse(perm.features);
        }

        return { permissions: currentPermissions };
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return { error: 'Gagal mengambil data hak akses', permissions: defaultRolePermissions };
    }
}

export async function updateRolePermissions(role: Role, features: string[]) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized', status: 401 };

        const requestingUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        });

        if (!requestingUser || (requestingUser.role !== 'OWNER' && requestingUser.role !== 'ADMIN')) {
            return { error: 'Akses ditolak.', status: 403 };
        }

        const featureString = JSON.stringify(features);

        await prisma.rolePermission.upsert({
            where: {
                role_tenantId: { role, tenantId: session.tenantId }
            },
            update: { features: featureString },
            create: { role, features: featureString, tenantId: session.tenantId },
        });

        revalidatePath('/dashboard/settings/permissions');
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error updating role permissions:', error);
        return { error: 'Gagal memperbarui hak akses', status: 500 };
    }
}

export async function getMyPermissions(clientRole?: string) {
    try {
        const session = await getSession();
        if (!session) return { urls: [] };

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true }
        });

        const activeRole = user?.role || (clientRole as Role) || 'STAFF';

        const perm = await prisma.rolePermission.findUnique({
            where: { role_tenantId: { role: activeRole as Role, tenantId: session.tenantId } }
        });

        if (perm) {
            return { urls: JSON.parse(perm.features) as string[] };
        }
        return { urls: defaultRolePermissions[activeRole as Role] || [] };
    } catch (e) {
        return { urls: [] };
    }
}
