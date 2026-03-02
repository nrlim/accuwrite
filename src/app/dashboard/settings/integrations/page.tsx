import { PrismaClient } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Link2, Activity, Shield, BookTemplate, ScrollText } from 'lucide-react';
import crypto from 'crypto';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/copy-button';

const prisma = new PrismaClient();

async function generateApiKeyAction(formData: FormData) {
    'use server'
    const session = await getSession();
    if (!session) return;

    // Default name if none provided
    const rawName = formData.get('name') as string;
    const nameStr = rawName ? rawName : `Integration Key - ${Date.now()}`;

    const rawKey = crypto.randomBytes(32).toString('hex');
    const secretKey = crypto.randomBytes(64).toString('hex');

    await prisma.apiKey.create({
        data: {
            name: nameStr,
            key: rawKey,     // Important: Show only once to user in real flow
            secret: secretKey, // Using this to hash webhooks/authenticate
            tenantId: session.tenantId,
        }
    });

    revalidatePath('/dashboard/settings/integrations');
}

async function createWebhookConfigAction(formData: FormData) {
    'use server'
    const session = await getSession();
    if (!session) return;

    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const events = formData.get('events') as string;

    if (!name || !url || !events) return;

    const secretKey = crypto.randomBytes(32).toString('hex');

    await prisma.webhookConfig.create({
        data: {
            name,
            url,
            secret: secretKey,
            events,
            tenantId: session.tenantId,
        }
    });

    revalidatePath('/dashboard/settings/integrations');
}

export default async function IntegrationsPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    // Fetch data concurrently for performance
    const [keys, hooks, logs] = await Promise.all([
        prisma.apiKey.findMany({
            where: { tenantId: session.tenantId },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.webhookConfig.findMany({
            where: { tenantId: session.tenantId },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.integrationLog.findMany({
            where: { tenantId: session.tenantId },
            orderBy: { createdAt: 'desc' },
            take: 100, // Show last 100 logs
        })
    ]);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">API & Webhook Integrations</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        Kelola autentikasi untuk *third-party service* (API Keys), atur pemicu notifikasi ke sistem eksternal (Webhooks), serta pantau riwayat request integrasi Anda pada panel sentral ini.
                    </p>
                </div>
                <div className="hidden md:flex">
                    <Button variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 gap-2" asChild>
                        <a href="/api-docs" target="_blank">
                            <BookTemplate className="h-4 w-4" /> Buka API Docs
                        </a>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="api-keys" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-8 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <TabsTrigger value="api-keys" className="data-[state=active]:shadow-sm"><Shield className="h-4 w-4 mr-2" /> API Keys</TabsTrigger>
                    <TabsTrigger value="webhooks" className="data-[state=active]:shadow-sm"><Link2 className="h-4 w-4 mr-2" /> Webhooks</TabsTrigger>
                    <TabsTrigger value="logs" className="data-[state=active]:shadow-sm"><ScrollText className="h-4 w-4 mr-2" /> Action Logs</TabsTrigger>
                </TabsList>

                {/* TAB: API KEYS */}
                <TabsContent value="api-keys" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-col md:flex-row justify-between md:items-start bg-zinc-50/50 dark:bg-zinc-900/20 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                            <div>
                                <CardTitle className="text-xl">Daftar API Key (Inbound)</CardTitle>
                                <CardDescription className="mt-1 max-w-xl">
                                    Akses _inbound_ aman untuk pihak ketiga *service* membuat koneksi ke Accuwrite API secara sah menggunakan metode Auth berbasis token rahasia HMAC.
                                </CardDescription>
                            </div>
                            <form action={generateApiKeyAction} className="mt-4 md:mt-0">
                                <input type="hidden" name="name" value="" />
                                <Button type="submit" variant="default" className="shadow-sm">
                                    <Key className="mr-2 h-4 w-4" />
                                    Generate Key Baru
                                </Button>
                            </form>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                    <TableRow>
                                        <TableHead className="px-6 h-12">Nama Integrasi</TableHead>
                                        <TableHead>Public Key</TableHead>
                                        <TableHead>Secret Token</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right px-6">Dibuat Pada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {keys.map((k) => (
                                        <TableRow key={k.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="font-medium px-6 py-4">{k.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
                                                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded font-mono border border-zinc-200 dark:border-zinc-700 select-all">pk_...{k.key.substring(0, 8)}</code>
                                                    <CopyButton text={k.key} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded font-mono truncate max-w-[120px] inline-block align-bottom border border-zinc-200 dark:border-zinc-700 select-all">{k.secret}</code>
                                                    <CopyButton text={k.secret} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {k.isActive ? (
                                                    <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-50 dark:bg-green-500/10 font-medium">Aktif</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-zinc-500 font-medium">Nonaktif</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-zinc-500 px-6">
                                                {new Date(k.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {keys.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Key className="h-8 w-8 text-zinc-300 mb-2 opacity-50" />
                                                    Belum ada API Key dibuat.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: WEBHOOKS */}
                <TabsContent value="webhooks" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/20 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                            <CardTitle className="text-xl">Tambah URL Webhook</CardTitle>
                            <CardDescription>Event *outbound* yang merespon sistem eksternal secara otomatis bila terjadi aksi (mis. *Invoice Dibuat*).</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form action={createWebhookConfigAction} className="grid sm:grid-cols-4 items-end gap-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Nama Webhook</label>
                                    <Input name="name" placeholder="Mis. Truxos" required className="bg-white dark:bg-zinc-950" />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Endpoint URL</label>
                                    <Input name="url" placeholder="https://truxos.my.id/api/hook" required className="bg-white dark:bg-zinc-950 font-mono text-sm" />
                                </div>
                                <div className="grid gap-2 hidden">
                                    <Input type="hidden" name="events" value="invoice.created,invoice.paid" />
                                </div>
                                <Button type="submit" variant="default" className="w-full shadow-sm text-sm">
                                    <Link2 className="mr-2 h-4 w-4" /> Hubungkan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-6">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/20 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                            <CardTitle className="text-xl">Daftar Endpoint Terdaftar</CardTitle>
                            <CardDescription className="mt-1">
                                Kelola titik endpoint pihak ketiga dan dapatkan *Validating Secret Token* untuk dekripsi *HMAC Header*.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                    <TableRow>
                                        <TableHead className="px-6">Nama Integrasi</TableHead>
                                        <TableHead>URL Destination</TableHead>
                                        <TableHead>Events Dihandle</TableHead>
                                        <TableHead>HMAC Secret</TableHead>
                                        <TableHead className="text-right px-6">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hooks.map((h) => (
                                        <TableRow key={h.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="font-medium px-6">{h.name}</TableCell>
                                            <TableCell>
                                                <code className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded max-w-xs block truncate border border-blue-100 dark:border-blue-900">{h.url}</code>
                                            </TableCell>
                                            <TableCell>
                                                {h.events.split(',').map((ev) => (
                                                    <Badge key={ev} variant="secondary" className="mr-1 mt-1 text-[10px] bg-zinc-200 dark:bg-zinc-800 border-none font-medium text-zinc-700 dark:text-zinc-300">{ev}</Badge>
                                                ))}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded font-mono truncate max-w-[100px] inline-block border border-zinc-200 dark:border-zinc-700 select-all">{h.secret}</code>
                                                    <CopyButton text={h.secret} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Hapus</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {hooks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Link2 className="h-8 w-8 text-zinc-300 mb-2 opacity-50" />
                                                    Tidak ada tujuan Webhooks tercatat.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: INTEGRATION LOGS */}
                <TabsContent value="logs" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/20 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                            <CardTitle className="text-xl">Histori Request Integrasi</CardTitle>
                            <CardDescription>Mencatat *HTTP Responses* asinkron atau sinkron di API *inbound* maupun *outbound webhook*.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                    <TableRow>
                                        <TableHead className="px-6 w-[200px]">Modul & Sumber</TableHead>
                                        <TableHead>Endpoint Ref</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="max-w-[200px]">Pesan Sistem</TableHead>
                                        <TableHead className="text-right px-6">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="font-semibold text-sm px-6 text-zinc-700 dark:text-zinc-300">
                                                <div className="flex items-center gap-2">
                                                    {log.status === 'SUCCESS' ? <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></div> : <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></div>}
                                                    <span className="truncate">{log.system}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono inline-block truncate max-w-[200px] border border-zinc-200 dark:border-zinc-700">
                                                    {log.endpoint}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                {log.status === 'SUCCESS' ? (
                                                    <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-50 dark:bg-green-500/10 text-[10px] font-semibold tracking-wider">OK / 200</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-50 dark:bg-red-500/10 text-[10px] font-semibold tracking-wider">FAILED</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-red-600 dark:text-red-400 font-medium max-w-[200px] truncate" title={log.errorMessage || undefined}>
                                                {log.errorMessage || <span className="text-zinc-400 font-normal italic">Tidak ada pesan error</span>}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-zinc-500 px-6 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Activity className="h-8 w-8 text-zinc-300 mb-2 opacity-50" />
                                                    Belum ada aktivitas integrasi yang terekam sistem.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
