"use client";

import { motion, type Variants } from "framer-motion";
import {
    BookOpen,
    Building2,
    RefreshCw,
    FileText,
    Zap,
    Shield,
} from "lucide-react";

const features = [
    {
        icon: BookOpen,
        title: "Buku Besar Otomatis",
        description:
            "Setiap transaksi tercatat instan lewat API. Bebaskan tim Anda dari input manual massal akhir bulan.",
        accent: "from-brand-500 to-brand-600",
        accentLight: "bg-brand-50 text-brand-600",
    },
    {
        icon: Building2,
        title: "Manajemen Multi-tenant",
        description:
            "Sistem konsolidasi andal untuk anak perusahaan, cabang, maupun grup bisnis dalam satu payung identitas yang terisolasi aman.",
        accent: "from-violet-500 to-violet-600",
        accentLight: "bg-violet-50 text-violet-600",
    },
    {
        icon: RefreshCw,
        title: "Sinkronisasi Real-time",
        description:
            "Integrasi dua arah dengan platform operasional Anda. Data selalu aktual tanpa latensi rekonsiliasi semalaman.",
        accent: "from-teal-500 to-teal-600",
        accentLight: "bg-teal-50 text-teal-600",
    },
    {
        icon: FileText,
        title: "Laporan Finansial Komprehensif",
        description:
            "Hasilkan Laba/Rugi, Neraca, dan Arus Kas berstandar audit hanya dengan sekali klik kapan pun dibutuhkan CEO/CFO.",
        accent: "from-amber-500 to-amber-600",
        accentLight: "bg-amber-50 text-amber-600",
    },
    {
        icon: Zap,
        title: "Algoritma Pencocokan Dinamis",
        description:
            "Identifikasi deviasi dan anomali transaksi seketika dengan AI-driven matching rules untuk mencegah bottleneck audit.",
        accent: "from-rose-500 to-rose-600",
        accentLight: "bg-rose-50 text-rose-600",
    },
    {
        icon: Shield,
        title: "Keamanan Data Tingkat Tinggi",
        description:
            "Enkripsi AES-256 tingkat militer, kontrol akses RBAC granular, dan jejak audit (audit log) permanen di setiap aktivitas.",
        accent: "from-slate-700 to-slate-900",
        accentLight: "bg-slate-100 text-slate-700",
    },
];

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function Features() {
    return (
        <section
            id="features"
            className="relative py-24 lg:py-32 bg-slate-50/50"
            aria-labelledby="features-heading"
        >
            {/* Background accent */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-brand-50/30 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-16 lg:mb-20"
                >
                    <span className="text-sm font-semibold text-teal-600 uppercase tracking-widest">
                        Kapabilitas Inti
                    </span>
                    <h2
                        id="features-heading"
                        className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
                    >
                        Pondasi Kuat untuk Kompleksitas Bisnis
                    </h2>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                        Dibangun khusus untuk menangani ribuan transaksi per detik secara presisi.
                        Accuwrite mengubah departemen keuangan Anda dari sekadar pelapor menjadi mitra strategis.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                variants={itemVariants}
                                className="group relative rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1"
                            >
                                {/* Icon */}
                                <div
                                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.accentLight} transition-transform duration-300 group-hover:scale-110`}
                                >
                                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                                </div>

                                {/* Content */}
                                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                    {feature.description}
                                </p>

                                {/* Hover gradient border accent */}
                                <div
                                    className={`absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-gradient-to-r ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                                />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
