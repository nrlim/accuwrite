"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock, RefreshCw, Plug } from "lucide-react";

const integrationApps = [
    { name: "truxOS", desc: "Sistem Logistik Inti", color: "bg-slate-900 text-white" },
    { name: "Bank API", desc: "Mutasi Otomatis", color: "bg-teal-600 text-white" },
    { name: "ERP", desc: "Data Perusahaan", color: "bg-brand-600 text-white" },
    { name: "Bea Cukai", desc: "Pajak & Manifes", color: "bg-cyan-600 text-white" },
    { name: "CRM", desc: "Data Pelanggan", color: "bg-emerald-600 text-white" },
    { name: "HRIS", desc: "Penggajian", color: "bg-blue-600 text-white" },
];

export default function Integrations() {
    return (
        <section
            id="integrations"
            className="relative py-24 lg:py-32 overflow-hidden bg-slate-50"
            aria-labelledby="integrations-heading"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <span className="text-sm font-semibold text-teal-600 uppercase tracking-widest">
                            Ekosistem Integrasi
                        </span>
                        <h2
                            id="integrations-heading"
                            className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
                        >
                            Sinkronisasi mulus di seluruh arsitektur Anda
                        </h2>
                        <p className="mt-5 text-lg text-slate-500 leading-relaxed">
                            Platform kami didesain khusus agar dapat terhubung dengan aplikasi operasional
                            Anda seperti truxOS, sistem perbankan swasta (open API), maupun ERP lainnya.
                            Seluruh rekam data mengalir seketika sebagai ayat jurnal finansial yang tervalidasi.
                        </p>

                        {/* Benefit List */}
                        <div className="mt-8 space-y-4">
                            {[
                                {
                                    icon: Plug,
                                    title: "Koneksi API Dedicated (Graph/REST)",
                                    desc: "Mendukung pertukaran data masif antar sistem dalam orde mikrodetik.",
                                },
                                {
                                    icon: RefreshCw,
                                    title: "Pemetaan Data Dua Arah",
                                    desc: "Setiap perubahan nilai di sisi operasional langsung memperbarui buku besar, dan sebaliknya.",
                                },
                                {
                                    icon: Lock,
                                    title: "Enkripsi Endpoint-to-Endpoint",
                                    desc: "SSL/TLS mutakhir dengan payload yang tersandi; zero-knowledge access dari pihak ketiga.",
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                            <Icon className="h-5 w-5" strokeWidth={1.8} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <a
                            href="#exclusive"
                            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                        >
                            Diskusikan kebutuhan arsitektur Anda
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                    </motion.div>

                    {/* Right: Integration Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="relative"
                    >
                        {/* Central Hub */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Orbital rings */}
                                <div className="absolute h-64 w-64 rounded-full border border-slate-200 sm:h-80 sm:w-80" />
                                <div className="absolute h-96 w-96 rounded-full border border-slate-200/60 hidden sm:block" />
                                <div className="absolute h-[480px] w-[480px] rounded-full border border-slate-100 hidden lg:block border-dashed" />
                            </div>

                            <div className="relative z-10 grid grid-cols-3 gap-4 sm:gap-6 p-8">
                                {integrationApps.map((app, i) => (
                                    <motion.div
                                        key={app.name}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: 0.1 * i }}
                                        viewport={{ once: true }}
                                        className="group flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl ${app.color} text-sm font-bold shadow-lg shadow-black/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                                        >
                                            {app.name.slice(0, 3).toUpperCase()}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-slate-800">
                                                {app.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{app.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Center Accuwrite hub */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-brand-700 to-slate-900 shadow-2xl shadow-brand-900/30 flex items-center justify-center border-4 border-white">
                                    <span className="text-xl font-bold text-white tracking-tight">AW</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
