"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section
            className="relative min-h-screen flex items-center overflow-hidden"
            aria-labelledby="hero-heading"
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 -z-10 bg-slate-50">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-50/60 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Headline */}
                    <motion.h1
                        id="hero-heading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]"
                    >
                        Akurasi finansial,{" "}
                        <span className="relative">
                            <span className="bg-gradient-to-r from-brand-700 via-brand-800 to-slate-900 bg-clip-text text-transparent">
                                otomatisasi maksimal.
                            </span>
                            <svg
                                className="absolute -bottom-2 left-0 w-full"
                                viewBox="0 0 300 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2 8.5C50 2.5 100 2 150 5.5C200 9 250 4.5 298 7"
                                    stroke="url(#underline-gradient)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient
                                        id="underline-gradient"
                                        x1="0"
                                        y1="0"
                                        x2="300"
                                        y2="0"
                                    >
                                        <stop offset="0%" stopColor="#1e40af" stopOpacity="0.3" />
                                        <stop offset="50%" stopColor="#1e40af" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#1e40af" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="mt-8 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto"
                    >
                        Accuwrite adalah jembatan vital antara sistem operasional Anda dengan laporan keuangan standar industri. Dirancang khusus untuk entitas bisnis
                        skala besar dengan presisi dan keamanan tingkat tinggi.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/register"
                            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-900/25 transition-all duration-300 hover:bg-slate-900 hover:shadow-slate-900/40 hover:gap-3 active:scale-[0.98]"
                        >
                            Daftar Sekarang
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>
                        <a
                            href="#integrations"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
                        >
                            Lihat Integrasi Kami
                        </a>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm font-medium text-slate-500"
                    >
                        <span>Dipercaya oleh 50+ Enterprise Group</span>
                        <div className="hidden sm:block h-4 w-px bg-slate-300" />
                        <span>Tersertifikasi SOC 2 Type II</span>
                        <div className="hidden sm:block h-4 w-px bg-slate-300" />
                        <span>SLA Uptime 99.99%</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
