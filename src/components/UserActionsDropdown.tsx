'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit, ShieldAlert } from 'lucide-react';
import { showNotification } from '@/hooks/use-notification';
import { updateUserRole, deleteUser } from '@/lib/actions/user-actions';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Role } from '@prisma/client';

export function UserActionsDropdown({
    user,
    isCurrentUser,
}: {
    user: { id: string; fullName: string; role: Role };
    isCurrentUser: boolean;
}) {
    const [openRoleDialog, setOpenRoleDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role>(user.role);

    async function handleUpdateRole() {
        setLoading(true);
        try {
            const result = await updateUserRole(user.id, selectedRole);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                showNotification(`Akses ${user.fullName} berhasil diperbarui`, 'success');
                setOpenRoleDialog(false);
            }
        } catch (error) {
            showNotification('Gagal memperbarui role', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteUser() {
        setLoading(true);
        try {
            const result = await deleteUser(user.id);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                showNotification(`Akun ${user.fullName} berhasil dihapus`, 'success');
                setOpenDeleteDialog(false);
            }
        } catch (error) {
            showNotification('Gagal menghapus user', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => setOpenRoleDialog(true)}
                        disabled={isCurrentUser}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpenDeleteDialog(true)}
                        disabled={isCurrentUser}
                        className="text-red-500 focus:text-red-500"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Akses
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog Edit Role */}
            <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role Staf</DialogTitle>
                        <DialogDescription>
                            Ubah hak akses untuk {user.fullName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select
                            value={selectedRole}
                            onValueChange={(val) => setSelectedRole(val as Role)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                <SelectItem value="AUDITOR">Auditor</SelectItem>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenRoleDialog(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleUpdateRole} disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Hapus User */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Akses Staf</DialogTitle>
                        <DialogDescription className="text-red-500 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Apakah Anda yakin ingin menghapus <b>{user.fullName}</b> secara permanen?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpenDeleteDialog(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={loading}
                        >
                            {loading ? 'Menghapus...' : 'Hapus Sekarang'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
