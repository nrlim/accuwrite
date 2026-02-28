"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Server, Briefcase } from "lucide-react";

export default function ExclusiveSolutions() {
    return (
        <section
            id="exclusive"
            className="relative py-24 lg:py-32 bg-slate-900 overflow-hidden text-white"
            aria-labelledby="exclusive-heading"
        >
            {/* Background Ornaments */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[800px] h-[800px] bg-brand-900/50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-teal-900/40 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <span className="text-sm font-semibold text-teal-400 uppercase tracking-widest">
                            Solusi Enterprise B2B
                        </span>
                        <h2
                            id="exclusive-heading"
                            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]"
                        >
                            Dirancang khusus untuk skala bisnis Anda.
                        </h2>
                        <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                            Kami tidak menawarkan paket langganan standar. Accuwrite dibangun secara khusus
                            (bespoke) untuk memenuhi arsitektur unik, volume transaksi, dan protokol
                            keamanan entitas bisnis berskala besar.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                            <a
                                href="mailto:contact@accuwrite.id"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-teal-500/25 transition-all duration-300 hover:bg-teal-400 hover:shadow-teal-500/40 hover:gap-3 active:scale-[0.98]"
                            >
                                Jadwalkan Konsultasi
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </a>
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 backdrop-blur px-8 py-4 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:shadow-md active:scale-[0.98]"
                            >
                                Pelajari Lebih Lanjut
                            </a>
                        </div>
                    </motion.div>

                    {/* Right Cards */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-8 hover:bg-slate-800 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900/50 text-brand-400 mb-6">
                                <Briefcase className="h-6 w-6" strokeWidth={1.8} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Implementasi Dedicated</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Tim teknis kami bekerja langsung dengan departemen finansial Anda
                                untuk memastikan integrasi tanpa hambatan ke ekosistem yang ada.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-8 sm:mt-12 hover:bg-slate-800 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-900/50 text-teal-400 mb-6">
                                <Server className="h-6 w-6" strokeWidth={1.8} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">On-Premise / Private Cloud</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Fleksibilitas deployment penuh sesuai regulasi data kepatuhan (compliance) perusahaan Anda.
                            </p>
                        </div>

                        <div className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-8 hover:bg-slate-800 transition-colors flex items-start gap-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
                                <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">SLA Superlatif & Support Khusus</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Perjanjian tingkat layanan (SLA) eksklusif dengan jalur dukungan prioritas (Dedicated Account Manager), memastikan sistem operasi nonstop 24/7/365.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
