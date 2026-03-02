'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(data: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'Unauthorized', status: 401 };
        }

        // Verify that the user has authority to create staff
        const requestingUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        });

        if (
            !requestingUser ||
            (requestingUser.role !== 'OWNER' && requestingUser.role !== 'ADMIN')
        ) {
            return { error: 'Akses ditolak. Hanya OWNER atau ADMIN yang dapat menambah staf.', status: 403 };
        }

        const fullName = data.get('fullName') as string;
        const username = data.get('username') as string;
        const password = data.get('password') as string;
        const role = data.get('role') as Role;

        if (!fullName || !username || !password || !role) {
            return { error: 'Semua kolom wajib diisi.', status: 400 };
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return { error: 'Username sudah digunakan, silakan pilih yang lain.', status: 400 };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                fullName,
                username,
                password: hashedPassword,
                role,
                tenantId: session.tenantId,
            },
        });

        revalidatePath('/dashboard/settings/users');
        return { success: true };
    } catch (error) {
        console.error('Error creating user:', error);
        return { error: 'Terjadi kesalahan saat menambahkan staf.', status: 500 };
    }
}

export async function updateUserRole(userId: string, newRole: Role) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'Unauthorized', status: 401 };
        }

        const requestingUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        });

        if (
            !requestingUser ||
            (requestingUser.role !== 'OWNER' && requestingUser.role !== 'ADMIN')
        ) {
            return { error: 'Akses ditolak.', status: 403 };
        }

        // Prevent modification of another tenant's user
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true },
        });

        if (!targetUser || targetUser.tenantId !== session.tenantId) {
            return { error: 'User tidak ditemukan atau akses ditolak.', status: 404 };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        revalidatePath('/dashboard/settings/users');
        return { success: true };
    } catch (error) {
        console.error('Error updating role:', error);
        return { error: 'Terjadi kesalahan saat memperbarui role staf.', status: 500 };
    }
}

export async function deleteUser(userId: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'Unauthorized', status: 401 };
        }

        if (session.userId === userId) {
            return { error: 'Anda tidak dapat menghapus akun Anda sendiri.', status: 400 };
        }

        const requestingUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        });

        if (
            !requestingUser ||
            (requestingUser.role !== 'OWNER' && requestingUser.role !== 'ADMIN')
        ) {
            return { error: 'Akses ditolak.', status: 403 };
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true },
        });

        if (!targetUser || targetUser.tenantId !== session.tenantId) {
            return { error: 'User tidak ditemukan atau akses ditolak.', status: 404 };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/dashboard/settings/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { error: 'Terjadi kesalahan saat menghapus staf.', status: 500 };
    }
}
