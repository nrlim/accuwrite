import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, Shield, Webhook, FileText, Users, BookOpen, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function CodeBlock({ title, code, language = 'json' }: { title?: string, code: string, language?: string }) {
    return (
        <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-sm my-4">
            {title && (
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400">{title}</span>
                    <CopyButton text={code} className="h-6 w-6 text-zinc-400 hover:text-white" />
                </div>
            )}
            {!title && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={code} className="h-6 w-6 text-zinc-400 hover:text-white" />
                </div>
            )}
            <div className="p-4 overflow-x-auto relative group">
                <pre className="text-[13px] leading-6 font-mono text-zinc-300">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

import React from 'react';

function SectionHeading({ id, title, icon: Icon }: { id: string, title: string, icon?: React.ElementType }) {
    return (
        <div className="flex items-center gap-3 mb-6 mt-16 group" id={id}>
            {Icon && <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Icon className="h-6 w-6" /></div>}
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 scroll-m-24">{title}</h2>
            <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity">
                #
            </a>
        </div>
    );
}

function SubHeading({ id, title }: { id: string, title: string }) {
    return (
        <h3 id={id} className="text-xl font-medium tracking-tight text-zinc-800 dark:text-zinc-200 mt-10 mb-4 scroll-m-24 flex items-center group">
            {title}
            <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity ml-2">
                #
            </a>
        </h3>
    );
}

function ParamTable({ rows }: { rows: { name: string, type: string, req?: boolean, desc: string }[] }) {
    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden my-4 bg-white dark:bg-zinc-950/50">
            <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Parameter</th>
                        <th className="px-4 py-3">Tipe Data</th>
                        <th className="px-4 py-3">Deskripsi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td className="px-4 py-3 align-top">
                                <code className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</code>
                                {row.req && <span className="block text-[10px] text-red-500 uppercase tracking-widest mt-1">Required</span>}
                            </td>
                            <td className="px-4 py-3 align-top">
                                <code className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono">{row.type}</code>
                            </td>
                            <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-400 text-sm">
                                {row.desc}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ApiDocumentationPage() {
    return (
        <div className="flex min-h-screen bg-white dark:bg-black selection:bg-blue-100 dark:selection:bg-blue-900/30">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 fixed h-screen overflow-y-auto">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 mb-8 uppercase tracking-widest font-bold text-sm">
                        <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white">A</div>
                        Accuwrite Docs
                    </Link>

                    <nav className="space-y-8 text-sm">
                        <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 px-2 flex items-center gap-2">
                                <BookOpen className="h-4 w-4" /> Getting Started
                            </h4>
                            <ul className="space-y-1">
                                <li><a href="#intro" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Introduction</a></li>
                                <li><a href="#authentication" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Authentication</a></li>
                                <li><a href="#errors" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Errors & Status Codes</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 px-2 flex items-center gap-2">
                                <Webhook className="h-4 w-4" /> Webhooks
                            </h4>
                            <ul className="space-y-1">
                                <li><a href="#webhooks-overview" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Overview & Security</a></li>
                                <li><a href="#webhooks-events" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Event Types</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 px-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Invoices API
                            </h4>
                            <ul className="space-y-1">
                                <li><a href="#create-invoice" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Create an Invoice</a></li>
                                <li><a href="#batch-invoices" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Create Batch Invoices</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 px-2 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Contacts API
                            </h4>
                            <ul className="space-y-1">
                                <li><a href="#list-contacts" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">List all Contacts</a></li>
                                <li><a href="#create-contact" className="block px-2 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Create a Contact</a></li>
                            </ul>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-[280px]">
                <div className="max-w-[1000px] mx-auto p-6 md:p-12 lg:p-16">

                    <div className="mb-16">
                        <Badge variant="outline" className="mb-4 text-blue-500 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">API Reference v1.0</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
                            Accuwrite API Documentation
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                            Selamat datang di dokumentasi API Accuwrite. Panduan ini akan membantu Anda mengintegrasikan sistem pihak ketiga seperti <strong>Truxos, Disbot, atau uWA</strong> ke dalam core sistem akuntansi Accuwrite secara aman dan terukur.
                        </p>
                    </div>

                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-10"></div>

                    {/* SECTION: INTRODUCTION */}
                    <SectionHeading id="intro" title="Introduction" icon={Terminal} />
                    <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
                        <p>
                            API Accuwrite diorganisasikan menggunakan arsitektur <strong>REST</strong>. Kami menggunakan URL yang dapat diprediksi (_resource-oriented_), mengembalikan *response* dalam format <strong>JSON</strong>, dan menggunakan kode status HTTP standar untuk indikasi keberhasilan atau kegagalan sebuah request.
                        </p>
                        <p>
                            Untuk menjaga performa sistem ERP, semua request pembuatan dokumen berat transaksi (seperti Invoice atau Jurnal) <strong>dilakukan secara asinkron (Background Queue)</strong>. Anda akan menerima HTTP `202 Accepted` sebagai tanda bahwa *job* telah dimasukkan ke dalam antrean (Queue).
                        </p>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg my-6">
                            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Base URL</span>
                            <code className="text-lg font-mono text-zinc-900 dark:text-zinc-100">https://api.accuwrite.id/v1</code>
                        </div>
                    </div>

                    {/* SECTION: AUTHENTICATION */}
                    <SectionHeading id="authentication" title="Authentication" icon={Shield} />
                    <div className="grid lg:grid-cols-2 gap-10">
                        <div>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Accuwrite menggunakan <strong>API Keys</strong> untuk memverifikasi setiap request yang masuk (Inbound). Anda dapat mengelola API Key dari dashboard pada menu <Link href="/dashboard/settings/integrations" className="text-blue-600 hover:underline">Integrasi & API</Link>.
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Setiap *request* wajib menyertakan header <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono text-zinc-800 dark:text-zinc-200">X-Accuwrite-Api-Key</code>. Request tanpa otentikasi akan ditolak dengan respons `401 Unauthorized`.
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 mt-6 text-sm text-amber-800 dark:text-amber-200 rounded-r">
                                <strong>⚠️ Peringatan Keamanan:</strong> Jangan memberikan API Key Anda kepada publik (front-end app, GitHub repo, dll). Rahasiakan API Key sebagaimana Anda merahasiakan _password_ database Anda.
                            </div>
                        </div>
                        <div>
                            <CodeBlock
                                title="Contoh Request Header"
                                code={`curl -X GET https://api.accuwrite.id/v1/contacts \\
  -H "Content-Type: application/json" \\
  -H "X-Accuwrite-Api-Key: sk_d8f79a2...328f"`}
                                language="bash"
                            />
                        </div>
                    </div>

                    {/* SECTION: ERRORS */}
                    <SectionHeading id="errors" title="Errors & Status Codes" icon={AlertCircle} />
                    <div className="text-zinc-600 dark:text-zinc-400 mb-6">
                        <p>Daftar respons HTTP status code yang umum digunakan pada seluruh *endpoint* REST kami.</p>
                        <div className="mt-4 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950/50">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    <tr>
                                        <td className="px-4 py-3 align-top font-mono font-bold text-green-600 w-24">200</td>
                                        <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100 w-32">OK</td>
                                        <td className="px-4 py-3 align-top">Permintaan berhasil dieksekusi (umumnya untuk metode GET).</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 align-top font-mono font-bold text-green-600">202</td>
                                        <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100">Accepted</td>
                                        <td className="px-4 py-3 align-top">Permintaan sukses diterima dan dimasukkan ke <em>Background Job Queue</em> untuk diproses secara asinkron.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 align-top font-mono font-bold text-red-500">400</td>
                                        <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100">Bad Request</td>
                                        <td className="px-4 py-3 align-top">Parameter yang diberikan tidak sesuai dengan skema API (mis. <em>Missing required fields</em>).</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 align-top font-mono font-bold text-red-500">401</td>
                                        <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100">Unauthorized</td>
                                        <td className="px-4 py-3 align-top">API Key tidak valid, kadaluarsa, atau tidak disematkan dalam header request.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 align-top font-mono font-bold text-red-500">429</td>
                                        <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100">Rate Limited</td>
                                        <td className="px-4 py-3 align-top">Permintaan terlalu banyak (lebih cepat batas per-menit yang diperbolehkan). Silahkan <em>retry</em> beberapa saat lagi.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-16"></div>

                    {/* SECTION: WEBHOOKS */}
                    <SectionHeading id="webhooks-overview" title="Menerima Webhooks" icon={Webhook} />
                    <div className="grid lg:grid-cols-2 gap-10">
                        <div>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Webhooks memungkinkan membangun aplikasi yang secara pasif merespons *event-event* yang terjadi dalam sistem Accuwrite. Hal ini menghapus kewajiban Anda melakukan *polling API* secara terus-menerus.
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                <strong>Keamanan (HMAC):</strong> Untuk memastikan data yang Anda terima benar-benar otentik dari server Accuwrite, setiap payload JSON Webhook yang kami kirimkan telah di-enkripsi menjadi *signature HMAC SHA-256*.
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Anda harus mencocokkan header <code>X-Accuwrite-Signature</code> pada di sisi server Node.js / PHP / Python Anda, menggunakan nilai <strong>Secret Webhook</strong> yang bisa didapatkan di URL <Link href="/dashboard/settings/integrations" className="text-blue-600 hover:underline">Integrasi & API {'->'} Tab Webhooks</Link>.
                            </p>
                        </div>
                        <div>
                            <CodeBlock
                                title="Verifikasi Signature (Contoh Node.js/Express)"
                                code={`import crypto from 'crypto';

app.post('/webhook/accuwrite', (req, res) => {
  const signature = req.headers['x-accuwrite-signature']; // 'sha256=....'
  const payload = JSON.stringify(req.body);
  const secret = process.env.ACCUWRITE_WEBHOOK_SECRET;

  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Tolak eksekusi jika tidak cocok
  // Disarankan gunakan timingSafeEqual di production
  if (signature !== expectedSig) {
    return res.status(401).send('Otentikasi HMAC Gagal!');
  }

  // Jika aman, tangani eventnya:
  if (req.body.event_type === 'invoice.paid') {
     console.log("Kirim pesan lunas ke WhatsApp uWA!");
  }
  
  res.status(200).send('OK');
});`}
                                language="javascript"
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 mt-16" id="webhooks-events">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 mb-4 flex items-center group">
                                Event Types (Trigger)
                                <a href="#webhooks-events" className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity ml-2">#</a>
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Saat ini, sistem Webhook Accuwrite mendukung penyiaran (broadcasting) atas event-event kritikal yang terjadi pada siklus penagihan dan pembayaran (Invoicing).
                            </p>

                            <ul className="space-y-4 mb-6">
                                <li className="bg-white dark:bg-zinc-950/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-900">invoice.created</Badge>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Terpicu ketika sebuah Invoice baru berhasil dibuat. Berguna untuk memicu bot (seperti disbot/uWA) mengirimkan notifikasi penagihan ke pelanggan via WhatsApp atau Email.</p>
                                </li>
                                <li className="bg-white dark:bg-zinc-950/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="font-mono text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-900">invoice.paid</Badge>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Terpicu ketika pembayaran telah diterima penuh dan mencatat Jurnal Kas. Sangat pas untuk mengirimkan bukti lunas secara otomatis tanpa campur tangan Admin.</p>
                                </li>
                            </ul>
                            <p className="text-sm text-zinc-500 italic">
                                * Event untuk entitas lainnya (seperti Contacts dan Journal Entries) akan didukung pada major rilis v1.1 mendatang.
                            </p>
                        </div>
                        <Tabs defaultValue="created" className="w-full">
                            <TabsList className="w-full mb-4 max-w-[300px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                                <TabsTrigger value="created" className="flex-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">invoice.created</TabsTrigger>
                                <TabsTrigger value="paid" className="flex-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">invoice.paid</TabsTrigger>
                            </TabsList>
                            <TabsContent value="created">
                                <CodeBlock
                                    title="PAYLOAD EVENT (invoice.created)"
                                    code={`{
  "event_id": "evt_9001abc7",
  "event_type": "invoice.created",
  "timestamp": "2026-03-03T10:00:25Z",
  "data": {
    "invoice": {
      "id": "inv_12ba...",
      "number": "TRX-10992",
      "status": "UNPAID",
      "total_amount": 15000000.00,
      "paid_amount": 0.00,
      "contact": {
        "id": "cuid...",
        "name": "PT Tambang Berkah Jaya",
        "phone": "+62811223344"
      }
    }
  }
}`}
                                    language="json"
                                />
                            </TabsContent>
                            <TabsContent value="paid">
                                <CodeBlock
                                    title="PAYLOAD EVENT (invoice.paid)"
                                    code={`{
  "event_id": "evt_9001abc8",
  "event_type": "invoice.paid",
  "timestamp": "2026-03-04T12:30:10Z",
  "data": {
    "invoice": {
      "id": "inv_12ba...",
      "number": "TRX-10992",
      "status": "PAID",
      "total_amount": 15000000.00,
      "paid_amount": 15000000.00,
      "contact": {
        "id": "cuid...",
        "name": "PT Tambang Berkah Jaya",
        "phone": "+62811223344"
      }
    }
  }
}`}
                                    language="json"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-16"></div>

                    {/* SECTION: INVOICES API */}
                    <SectionHeading id="create-invoice" title="Create an Invoice" icon={FileText} />
                    <div className="grid lg:grid-cols-2 gap-10">
                        <div>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Membuat invoice *Customer* secara asinkron. Direkomendasikan digunakan ketika *Driver TruXos* selesai melakukan *Delivery* barang, sehingga Jurnal Piutang akan dicatat secara mendatar di belakang layar (Background Queue).
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 uppercase tracking-widest font-bold">POST</Badge>
                                <code className="font-mono text-zinc-900 dark:text-zinc-100">/api/v1/invoices</code>
                            </div>

                            <SubHeading id="invoice-headers" title="Headers Tambahan" />
                            <ParamTable rows={[
                                { name: 'Idempotency-Key', type: 'string', req: true, desc: 'UUID unik (v4) untuk mencegah duplikasi (karena limitasi network retry/double click).' }
                            ]} />

                            <SubHeading id="invoice-params" title="Body Parameters" />
                            <ParamTable rows={[
                                { name: 'sourceSys', type: 'string', req: true, desc: 'Nama aplikasi pembuat. (Contoh: "TruXos")' },
                                { name: 'contactId', type: 'string', req: true, desc: 'ID Customer/Kontak yang valid dari sistem Accuwrite.' },
                                { name: 'number', type: 'string', req: true, desc: 'Nomor nota dari third-party. (Maksimal 50 Karakter).' },
                                { name: 'date', type: 'datetime', req: true, desc: 'Tanggal dikeluarkannya Invoice (Format ISO8601).' },
                                { name: 'amount', type: 'decimal', req: true, desc: 'Total jumlah nominal tagihan (Numerik murni).' },
                                { name: 'category', type: 'string', req: false, desc: 'Kategori tagihan ("Solar", "Sewa"). Akan otomatis di-map ke Chart of Account.' },
                                { name: 'description', type: 'string', req: false, desc: 'Keterangan Memo invoice secara jelas.' },
                            ]} />
                        </div>
                        <div className="space-y-6">
                            <CodeBlock
                                title="REQUEST (POST /v1/invoices)"
                                code={`{
  "sourceSys": "TruXos",
  "contactId": "cmrd5fa...",
  "number": "TRX-10992",
  "date": "2026-03-03T00:00:00Z",
  "dueDate": "2026-03-10T00:00:00Z",
  "category": "Solar",
  "amount": 15000000.00,
  "description": "Bahan Bakar Hino B1921VX"
}`}
                                language="json"
                            />
                            <CodeBlock
                                title="RESPONSE (202 Accepted)"
                                code={`{
  "status": "success",
  "message": "Job successfully queued.",
  "data": {
    "jobId": "23bd1-49a3-b293-1acb",
    "idempotencyKey": "uniq-request-xyz"
  }
}`}
                                language="json"
                            />
                        </div>
                    </div>

                    {/* SECTION: BATCH INVOICES API */}
                    <div className="grid lg:grid-cols-2 gap-10 mt-16" id="batch-invoices">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 mb-4 flex items-center group">
                                Create Batch Invoices
                                <a href="#batch-invoices" className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity ml-2">#</a>
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Memasukkan beberapa Invoice atau mem-_batch_ pengiriman *daily report*. Sangat berguna jika sistem integrasi hanya mengirimkan rekapitulasi data sekali dalam sehari (via CRON). Limit maksimal: 100 Invoice per *request*.
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 uppercase tracking-widest font-bold">POST</Badge>
                                <code className="font-mono text-zinc-900 dark:text-zinc-100">/api/v1/invoices/batch</code>
                            </div>

                            <SubHeading id="batch-invoice-params" title="Body Parameters" />
                            <ParamTable rows={[
                                { name: 'items', type: 'array', req: true, desc: 'Array berisi daftar 1-100 objek invoice.' },
                                { name: 'items[].idempotencyKey', type: 'string', req: true, desc: 'Kunci idempotensi per transaksi (Misalnya: ID Unik Delivery dari TruXos).' },
                                { name: '...', type: 'object', req: false, desc: 'Semua variabel _Invoice biasa_ harus disertakan dalam tiap block array item.' },
                            ]} />
                        </div>
                        <div className="space-y-6">
                            <CodeBlock
                                title="REQUEST (POST /v1/invoices/batch)"
                                code={`{
  "items": [
    {
      "idempotencyKey": "dlv-00122",
      "sourceSys": "TruXos",
      "contactId": "cuid...",
      "number": "TRX-10992",
      "date": "2026-03-03T00:00:00Z",
      "amount": 15000000.00
    },
    {
      "idempotencyKey": "dlv-00123",
      "sourceSys": "TruXos",
      "contactId": "cuid...",
      "number": "TRX-10993",
      "date": "2026-03-03T00:00:00Z",
      "amount": 1800000.00
    }
  ]
}`}
                                language="json"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-16"></div>

                    {/* SECTION: CONTACTS API */}
                    <SectionHeading id="list-contacts" title="Contacts API" icon={Users} />
                    <div className="grid lg:grid-cols-2 gap-10">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 mb-4 flex items-center group">
                                List all Contacts
                                <a href="#list-contacts" className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity ml-2">#</a>
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Tarik data seluruh koneksi (Pelanggan atau Supplier) untuk melakukan sinkronisasi dengan Database eksternal. Secara bawaan (default), endpoint ini membawa paginasi.
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 uppercase tracking-widest font-bold">GET</Badge>
                                <code className="font-mono text-zinc-900 dark:text-zinc-100">/api/v1/contacts</code>
                            </div>

                            <SubHeading id="contact-query-params" title="Query Parameters" />
                            <ParamTable rows={[
                                { name: 'type', type: 'string', req: false, desc: 'Filter jenis kontak: "CUSTOMER", "VENDOR", atau "BOTH".' },
                                { name: 'page', type: 'integer', req: false, desc: 'Nomor halaman untuk *Pagination* (Default: 1).' },
                                { name: 'limit', type: 'integer', req: false, desc: 'Jumlah baris per halaman (Maksimal: 100).' },
                                { name: 'search', type: 'string', req: false, desc: 'Pencarian sebagian teks (menggunakan ILIKE pada nama/email).' },
                            ]} />
                        </div>
                        <div className="space-y-6">
                            <CodeBlock
                                title="REQUEST (GET /v1/contacts?type=CUSTOMER&limit=2)"
                                code={`curl -G https://api.accuwrite.id/v1/contacts \\
  -d "type=CUSTOMER" \\
  -d "limit=2" \\
  -H "X-Accuwrite-Api-Key: sk_xxx"`}
                                language="bash"
                            />
                            <CodeBlock
                                title="RESPONSE (200 OK)"
                                code={`{
  "status": "success",
  "data": [
    {
      "id": "cmrd5fa89000a2xqw9j7",
      "name": "PT Transportasi Lintas Nusantara",
      "type": "CUSTOMER",
      "email": "finance@lintasnusantara.com",
      "phone": "08119992019",
      "address": "Jl. Gatot Subroto No 15. Jakarta",
      "npwp": "01.234.567.8-091.000",
      "createdAt": "2026-02-15T12:00:00Z"
    },
    {
      "id": "cpz99xa1010b4kzmll01",
      "name": "CV Abadi Megah Prima",
      "type": "CUSTOMER",
      "email": "info@abadimegah.id",
      "phone": null,
      "address": null,
      "npwp": null,
      "createdAt": "2026-02-28T09:12:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "totalCount": 145,
    "totalPages": 73
  }
}`}
                                language="json"
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 mt-16" id="create-contact">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 mb-4 flex items-center group">
                                Create a Contact
                                <a href="#create-contact" className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity ml-2">#</a>
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                Menambahkan data Pelanggan atau *Vendor* (Pemasok) baru dari CRM pihak ketiga secara _real-time_. (Operasi ini berlangsung Sinkron / Langsung direspon ID-nya).
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 uppercase tracking-widest font-bold">POST</Badge>
                                <code className="font-mono text-zinc-900 dark:text-zinc-100">/api/v1/contacts</code>
                            </div>

                            <SubHeading id="contact-create-params" title="Body Parameters" />
                            <ParamTable rows={[
                                { name: 'name', type: 'string', req: true, desc: 'Nama Perusahaan/Individu. Maks 100 Karakter.' },
                                { name: 'type', type: 'string', req: true, desc: 'Enum: "CUSTOMER", "VENDOR", atau "BOTH".' },
                                { name: 'email', type: 'string', req: false, desc: 'Alamat surel kontak yang valid untuk korespondensi.' },
                                { name: 'phone', type: 'string', req: false, desc: 'Nomor telepon.' },
                                { name: 'address', type: 'string', req: false, desc: 'Alamat lengkap domisili logistik.' },
                                { name: 'npwp', type: 'string', req: false, desc: 'Nomor Pokok Wajib Pajak untuk Faktur Pajak.' },
                            ]} />
                        </div>
                        <div className="space-y-6">
                            <CodeBlock
                                title="REQUEST (POST /v1/contacts)"
                                code={`{
  "name": "PT Tambang Berkah Jaya",
  "type": "CUSTOMER",
  "email": "finance@tambangberkah.com",
  "phone": "+62811223344",
  "address": "Site Office B2, Kalimantan",
  "npwp": "99.001.293.1-022.000"
}`}
                                language="json"
                            />
                            <CodeBlock
                                title="RESPONSE (201 Created)"
                                code={`{
  "status": "success",
  "message": "Contact created successfully",
  "data": {
    "id": "new-cuid-992a...",
    "name": "PT Tambang Berkah Jaya",
    "type": "CUSTOMER",
    "createdAt": "2026-03-03T03:30:15Z"
  }
}`}
                                language="json"
                            />
                        </div>
                    </div>


                    <div className="my-[200px] text-center text-zinc-400">
                        <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Dokumentasi API Terus Berkembang.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}
