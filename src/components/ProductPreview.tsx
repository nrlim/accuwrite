"use client";

import { motion } from "framer-motion";
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    DollarSign,
    PieChart,
} from "lucide-react";

// Static data for sparklines to avoid SSR hydration mismatches
const revenueSparkline = [50, 52, 58, 65, 71, 75, 82, 80, 88, 95];
const costSparkline = [50, 48, 45, 42, 45, 40, 35, 30, 25, 20];
const profitSparkline = [50, 54, 61, 70, 78, 85, 95, 92, 105, 115];

// Helper to draw SVG sparkline paths
const toSvgPath = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = 100 / (data.length - 1);

    return data.reduce((acc, val, i) => {
        const x = i * stepX;
        const y = 100 - ((val - min) / range) * 100;
        return `${acc} ${i === 0 ? "M" : "L"} ${x} ${y}`;
    }, "");
};

// Dummy Recent Transactions
const recentActivity = [
    {
        id: "TXN-089",
        source: "API: truxOS",
        description: "Pendapatan Faktur #INV-4029",
        amount: "Rp 125.000.000",
        type: "credit",
        time: "2 menit lalu",
    },
    {
        id: "TXN-088",
        source: "API: Stripe",
        description: "Pembayaran Vendor Terjadwal",
        amount: "Rp 45.200.000",
        type: "debit",
        time: "15 menit lalu",
    },
    {
        id: "TXN-087",
        source: "Manual Entry",
        description: "Penyesuaian Jurnal Q3",
        amount: "Rp 12.000.000",
        type: "credit",
        time: "1 jam lalu",
    },
    {
        id: "TXN-086",
        source: "API: truxOS",
        description: "Pembayaran Klien XYZ Corp",
        amount: "Rp 310.500.000",
        type: "credit",
        time: "3 jam lalu",
    },
];

export default function ProductPreview() {
    return (
        <section id="product" className="relative py-24 lg:py-32" aria-labelledby="product-heading">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold text-teal-600 uppercase tracking-widest">
                        Visualisasi Data Real-time
                    </span>
                    <h2 id="product-heading" className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                        Inteligensi Finansial dalam Satu Layar
                    </h2>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                        Pantau arus kas, beban operasional, dan laba bersih Anda melalui
                        dashboard interaktif yang tersinkronisasi langsung dengan sistem inti operasional.
                    </p>
                </motion.div>

                {/* Dashboard Mockup (Glassmorphism & Soft Shadows) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative mx-auto max-w-5xl"
                >
                    {/* Subtle glowing orb under the dashboard */}
                    <div className="absolute inset-0 bg-teal-200/40 rounded-[2rem] blur-3xl scale-105 -z-10" />

                    {/* Main Glass Panel */}
                    <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-brand-900/10 overflow-hidden ring-1 ring-black/5">
                        {/* Window Controls */}
                        <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3.5 bg-white/40">
                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                            <div className="ml-4 flex items-center gap-2 rounded-md bg-white/50 px-3 py-1.5 text-xs text-slate-400 border border-white/60">
                                app.accuwrite.id / executive-dashboard
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {/* Dashboard Header */}
                            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-900">
                                        Executive Dashboard
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Ringkasan Finansial: Hari ini, 09:41 WIB
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                                        Sinkronisasi Aktif
                                    </span>
                                    <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-md">
                                        Unduh Laporan
                                    </button>
                                </div>
                            </div>

                            {/* Summary Widgets Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Total Revenue */}
                                <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                                Total Pendapatan
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                Rp 8.45 M
                                            </p>
                                        </div>
                                        <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                            +12.5%
                                        </span>
                                    </div>
                                    <div className="mt-4 h-10 w-full">
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                                            <path d={toSvgPath(revenueSparkline)} fill="none" stroke="#10b981" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Operational Costs */}
                                <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-amber-500" />
                                                Beban Operasional
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                Rp 2.12 M
                                            </p>
                                        </div>
                                        <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                            -4.2%
                                        </span>
                                    </div>
                                    <div className="mt-4 h-10 w-full">
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                                            <path d={toSvgPath(costSparkline)} fill="none" stroke="#f59e0b" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Net Profit */}
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 to-slate-900 p-5 shadow-lg text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-brand-100 flex items-center gap-2">
                                                <PieChart className="h-4 w-4 text-teal-400" />
                                                Laba Bersih
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-white">
                                                Rp 6.33 M
                                            </p>
                                        </div>
                                        <span className="flex items-center text-xs font-semibold text-teal-300 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                            +18.4%
                                        </span>
                                    </div>
                                    <div className="mt-4 h-10 w-full">
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                                            <path d={toSvgPath(profitSparkline)} fill="none" stroke="#2dd4bf" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Lower Section: Chart & Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Dynamic Chart Area */}
                                <div className="lg:col-span-2 rounded-xl bg-white border border-slate-100 p-5 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-sm font-semibold text-slate-900">Tren Arus Kas (YTD)</h4>
                                        <select className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none">
                                            <option>Tahun Ini</option>
                                            <option>Tahun Lalu</option>
                                        </select>
                                    </div>
                                    {/* CSS-based Bar Chart Simulation */}
                                    <div className="h-48 flex items-end gap-2 justify-between mt-4">
                                        {[40, 65, 55, 80, 75, 90, 85, 110, 100, 120, 115, 130].map((val, i) => (
                                            <div key={i} className="group relative flex flex-col items-center flex-1 h-full justify-end">
                                                {/* Hover Tooltip */}
                                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                    Bulan {i + 1}: Rp {(val * 24).toFixed(0)} Juta
                                                </div>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${(val / 130) * 100}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.05 }}
                                                    viewport={{ once: true }}
                                                    className="w-full bg-gradient-to-t from-brand-600 to-teal-400 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                ></motion.div>
                                                <span className="text-[10px] text-slate-400 mt-2 font-medium">
                                                    {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="rounded-xl bg-white border border-slate-100 p-5 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-semibold text-slate-900">Aktivitas Jurnal Terbaru</h4>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                        {recentActivity.map((tx) => (
                                            <div key={tx.id} className="flex flex-col gap-1.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        {tx.source}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{tx.time}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                    {tx.description}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-mono text-slate-500">{tx.id}</span>
                                                    <span className={`text-sm font-semibold ${tx.type === "credit" ? "text-emerald-600" : "text-slate-800"}`}>
                                                        {tx.type === "credit" ? "+" : "-"}{tx.amount}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-brand-700 rounded-lg transition-colors">
                                        Lihat Semua Transaksi
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
