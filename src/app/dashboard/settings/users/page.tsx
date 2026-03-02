import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AddUserModal } from '@/components/AddUserModal';
import { UserActionsDropdown } from '@/components/UserActionsDropdown';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Manajemen Staf | AccuWrite',
    description: 'Kelola akun pengguna dan hak akses staf untuk tenant Anda.',
};

export default async function UsersPage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    // Ambil data user yang sedang login untuk memeriksa akses owner/admin
    const currentUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, role: true, tenantId: true },
    });

    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
        redirect('/dashboard'); // Atau route error forbidden
    }

    // Ambil daftar staf di bawah tenant yang sama
    const users = await prisma.user.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            createdAt: true,
        },
    });

    return (
        <div className="flex-1 space-y-4 pt-2">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Manajemen Staf</h2>
                    <p className="text-muted-foreground mt-2">
                        Kelola akun staf, atur role, dan kelola akses mereka ke dalam sistem.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <AddUserModal />
                </div>
            </div>

            <Card className="mt-6 border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Staf dan Akses</CardTitle>
                    <CardDescription>
                        Menampilkan semua staf yang terdaftar pada tenant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700">Nama Lengkap</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Username</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Tanggal Dibuat</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Belum ada staf yang ditambahkan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const isYou = user.id === currentUser.id;

                                        return (
                                            <TableRow key={user.id} className="transition-colors hover:bg-slate-50/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {user.fullName}
                                                        {isYou && (
                                                            <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                                                                Anda
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={user.role === 'OWNER' || user.role === 'ADMIN' ? 'default' : 'outline'}
                                                        className={
                                                            user.role === 'OWNER' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                                                                user.role === 'ADMIN' ? 'bg-slate-800 text-white hover:bg-slate-900' : ''
                                                        }
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.DateTimeFormat('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    }).format(new Date(user.createdAt))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <UserActionsDropdown
                                                        user={{ id: user.id, fullName: user.fullName, role: user.role }}
                                                        isCurrentUser={isYou}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
