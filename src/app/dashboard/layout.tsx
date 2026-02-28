'use client';

import * as React from 'react';
import {
    BookOpen,
    Briefcase,
    FileText,
    LayoutDashboard,
    LogOut,
    Search,
    Settings,
    User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const navItems = [
    { title: 'Ringkasan', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Jurnal Umum', url: '/dashboard/jurnal', icon: BookOpen },
    { title: 'Buku Besar', url: '/dashboard/buku-besar', icon: Briefcase },
    { title: 'Laporan Keuangan', url: '/dashboard/laporan', icon: FileText },
    { title: 'Pengaturan', url: '/dashboard/pengaturan', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [tenantName, setTenantName] = React.useState<string>('Memuat...');
    const [userName, setUserName] = React.useState<string>('Pengguna');

    React.useEffect(() => {
        // Authenticate client side
        const token = localStorage.getItem('accuwrite_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const tenant = JSON.parse(localStorage.getItem('accuwrite_tenant') || '{}');
            const user = JSON.parse(localStorage.getItem('accuwrite_user') || '{}');

            if (tenant.name) setTenantName(tenant.name);
            if (user.fullName) setUserName(user.fullName);
        } catch (e) {
            console.error('Failed to parse auth data');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('accuwrite_token');
        localStorage.removeItem('accuwrite_user');
        localStorage.removeItem('accuwrite_tenant');
        router.push('/login');
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
                <Sidebar>
                    <SidebarHeader className="h-16 flex items-center justify-center border-b px-4">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-500">
                            <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                                A
                            </div>
                            <span>Accuwrite</span>
                        </div>
                    </SidebarHeader>
                    <SidebarContent className="px-2 py-4">
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url} className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter className="border-t p-4">
                        <div className="text-xs text-zinc-500 text-center flex flex-col items-center">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{tenantName}</span>
                            <span>&copy; {new Date().getFullYear()} Accuwrite</span>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="flex h-16 items-center gap-4 border-b bg-white dark:bg-zinc-900 px-6 shrink-0">
                        <SidebarTrigger className="-ml-2" />

                        {/* Global Search */}
                        <div className="flex-1 flex items-center">
                            <div className="relative w-full max-w-md hidden md:flex">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="search"
                                    placeholder="Cari transaksi, laporan..."
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none pl-9 focus-visible:ring-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-sm font-medium">
                                <span className="text-zinc-500">Tenant:</span> <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{tenantName}</span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full bg-zinc-100 dark:bg-zinc-800" aria-label="Menu pengguna">
                                        <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span>{userName}</span>
                                            <span className="text-xs text-zinc-500 font-normal">Administrator</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profil</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Pengaturan</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Keluar</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-6 md:p-8">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
