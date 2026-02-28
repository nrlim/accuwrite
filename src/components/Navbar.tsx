"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BarChart3 } from "lucide-react";
import Link from "next/link";

const navLinks = [
    { label: "Produk", href: "#product" },
    { label: "Solusi Eksklusif", href: "#exclusive" },
    { label: "Fitur", href: "#features" },
    { label: "Integrasi", href: "#integrations" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-slate-200/60"
                : "bg-transparent"
                }`}
        >
            <nav
                className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
                aria-label="Navigasi Utama"
            >
                {/* Logo */}
                <a href="#" className="flex items-center gap-2.5 group" aria-label="Beranda Accuwrite">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-600/20 group-hover:shadow-brand-600/40 transition-shadow duration-300">
                        <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        Accu<span className="text-brand-600">write</span>
                    </span>
                </a>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:items-center lg:gap-1">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 rounded-lg hover:bg-slate-50"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden lg:flex lg:items-center lg:gap-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
                    >
                        Masuk
                    </Link>
                    <Link
                        href="/register"
                        className="inline-flex items-center justify-center rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-800 hover:shadow-md active:scale-[0.98]"
                    >
                        Daftar Akun
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-slate-200"
                    >
                        <div className="mx-auto max-w-7xl px-6 pb-6 pt-2 space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
                                <Link
                                    href="/login"
                                    className="block text-center rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="block text-center rounded-lg bg-brand-900 px-4 py-3 text-base font-semibold text-white hover:bg-brand-800 transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Daftar Akun
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
