'use client';

import React, { useState, useEffect } from 'react';
import { getRolePermissions, updateRolePermissions } from '@/lib/actions/permission-actions';
import { defaultRolePermissions } from '@/lib/constants';
import { Role } from '@prisma/client';
import { showNotification } from '@/hooks/use-notification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const ALL_FEATURES = [
    { label: 'Ringkasan Dashboard', value: '/dashboard' },
    { label: 'Bagan Akun', value: '/dashboard/bagan-akun' },
    { label: 'Jurnal Umum', value: '/dashboard/jurnal' },
    { label: 'Kas & Bank', value: '/dashboard/kas-bank' },
    { label: 'Buku Besar', value: '/dashboard/buku-besar' },
    { label: 'Piutang (AR)', value: '/dashboard/piutang' },
    { label: 'Hutang (AP)', value: '/dashboard/hutang' },
    { label: 'Kontak', value: '/dashboard/kontak' },
    { label: 'Laporan', value: '/dashboard/laporan' },
    { label: 'Manajemen Staf', value: '/dashboard/settings/users' },
    { label: 'Pengaturan Hak Akses', value: '/dashboard/settings/permissions' },
];

export default function PermissionsClient() {
    const [permissions, setPermissions] = useState<Record<Role, string[]>>(defaultRolePermissions);
    const [selectedRole, setSelectedRole] = useState<Role>('MANAGER');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            const data = await getRolePermissions();
            if (data.permissions) {
                setPermissions(data.permissions);
            }
            setLoading(false);
        };
        fetchPermissions();
    }, []);

    const currentFeatures = permissions[selectedRole] || [];

    const handleToggle = (featureValue: string) => {
        setPermissions((prev) => {
            const current = prev[selectedRole] || [];
            const isEnabled = current.includes(featureValue);

            const newlyAssigned = isEnabled
                ? current.filter(x => x !== featureValue)
                : [...current, featureValue];

            return {
                ...prev,
                [selectedRole]: newlyAssigned
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateRolePermissions(selectedRole, permissions[selectedRole]);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                showNotification(`Hak akses role ${selectedRole} berhasil disimpan!`, 'success');
            }
        } catch (error) {
            showNotification('Terjadi kesalahan saat menyimpan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleAll = () => {
        if (selectedRole === 'OWNER') return;
        const allValues = ALL_FEATURES.map(f => f.value);
        const hasAll = currentFeatures.length === allValues.length;

        setPermissions(prev => ({
            ...prev,
            [selectedRole]: hasAll ? ['/dashboard'] : allValues // Always keep at least dashboard
        }));
    };

    const isAllSelected = currentFeatures.length === ALL_FEATURES.length;

    if (loading) return <div className="p-8">Memuat hak akses...</div>;

    return (
        <div className="flex-1 space-y-4 pt-2">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pengaturan Hak Akses</h2>
                    <p className="text-muted-foreground mt-2">
                        Atur visibilitas fitur dan hak akses untuk masing-masing tipe Staff pada organisasi Anda.
                    </p>
                </div>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                    <CardDescription>
                        Pilih peran di bawah ini, lalu centang kotak untuk menentukan fitur apa saja yang dapat mereka lihat.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 mt-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="w-full sm:w-80">
                            <Label className="text-sm text-zinc-500 mb-1.5 block">Pilih Peran (Role)</Label>
                            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as Role)}>
                                <SelectTrigger className="bg-white dark:bg-zinc-950 font-medium h-11">
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OWNER">Owner (Pemilik)</SelectItem>
                                    <SelectItem value="ADMIN">Admin (Administrator Sistem)</SelectItem>
                                    <SelectItem value="MANAGER">Manager (Manajer)</SelectItem>
                                    <SelectItem value="ACCOUNTANT">Accountant (Akuntan)</SelectItem>
                                    <SelectItem value="AUDITOR">Auditor (Reviewer)</SelectItem>
                                    <SelectItem value="STAFF">Staff (Staf Umum)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedRole !== 'OWNER' && (
                            <Button variant="outline" size="sm" onClick={toggleAll} className="shrink-0 mt-6 sm:mt-0">
                                {isAllSelected ? 'Kosongkan Semua' : 'Pilih Semua'}
                            </Button>
                        )}
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Akses Navigasi & Fitur</h3>
                            <span className="text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                                {currentFeatures.length} / {ALL_FEATURES.length} Fitur
                            </span>
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {ALL_FEATURES.map((feature) => {
                                const isChecked = currentFeatures.includes(feature.value);
                                return (
                                    <div
                                        key={feature.value}
                                        onClick={() => selectedRole !== 'OWNER' && handleToggle(feature.value)}
                                        className={`flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${isChecked
                                            ? 'bg-blue-50/50 border-blue-200 shadow-sm dark:bg-blue-900/10 dark:border-blue-800'
                                            : 'bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                                            } ${(selectedRole === 'OWNER') ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Checkbox
                                            id={feature.value}
                                            checked={isChecked}
                                            // onCheckedChange is handled by parent div onClick
                                            disabled={selectedRole === 'OWNER'}
                                            className={`mt-0.5 ${isChecked ? 'data-[state=checked]:bg-blue-600 data-[state=checked]:text-white' : ''}`}
                                        />
                                        <div className="grid gap-1.5 flex-1 items-center h-full">
                                            <Label
                                                htmlFor={feature.value}
                                                className={`text-sm font-semibold cursor-pointer ${isChecked ? 'text-blue-900 dark:text-blue-200' : 'text-zinc-700 dark:text-zinc-300'}`}
                                            >
                                                {feature.label}
                                            </Label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedRole === 'OWNER' && (
                        <p className="text-sm text-amber-600 font-medium">
                            Role tingkat OWNER disarankan untuk mempertahankan pengaturan visibilitas penuh agar konfigurasi sistem bisa selalu diakses. Modifikasi diblokir di antarmuka ini.
                        </p>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={saving || selectedRole === 'OWNER'}>
                            {saving ? 'Menyimpan...' : `Simpan Hak Akses ${selectedRole}`}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
