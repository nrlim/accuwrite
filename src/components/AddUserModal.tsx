'use client';

import { useState } from 'react';
import { createUser } from '@/lib/actions/user-actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { showNotification } from '@/hooks/use-notification';
import { Plus } from 'lucide-react';

export function AddUserModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await createUser(formData);

            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                showNotification('Staf berhasil ditambahkan', 'success');
                setOpen(false); // Close dialog
            }
        } catch (error) {
            showNotification('Terjadi kesalahan yang tidak terduga', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Staf Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Tambah Staf Baru</DialogTitle>
                        <DialogDescription>
                            Tambahkan akun staf baru untuk mengakses sistem.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="Masukkan username unik"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Masukkan password sementara"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Role / Akses</Label>
                            <Select name="role" required defaultValue="STAFF">
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                                    <SelectItem value="STAFF">Staff</SelectItem>
                                    {/* OWNER and ADMIN should generally be restricted, but let's include ADMIN if appropriate, or maybe restrict owners */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Staf'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
