import { BarChart3 } from "lucide-react";

const footerLinks = {
    Produk: [
        { label: "Fitur Utams", href: "#features" },
        { label: "Ekosistem Integrasi", href: "#integrations" },
        { label: "Solusi Spesifik", href: "#exclusive" },
        { label: "Dokumentasi API", href: "#" },
    ],
    Perusahaan: [
        { label: "Tentang Kami", href: "#" },
        { label: "Karir Konsultan", href: "#" },
        { label: "Investor Relations", href: "#" },
        { label: "Kontak Korporat", href: "#" },
    ],
    Kepatuhan: [
        { label: "Kebijakan Privasi", href: "#" },
        { label: "Syarat Layanan B2B", href: "#" },
        { label: "Infrastruktur Keamanan", href: "#" },
        { label: "SOC 2 Laporan", href: "#" },
    ],
};

export default function Footer() {
    return (
        <footer
            className="border-t border-slate-100 bg-white"
            aria-label="Footer"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-2">
                        <a href="#" className="flex items-center gap-2.5" aria-label="Beranda Accuwrite">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 shadow-md shadow-brand-900/20">
                                <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                Accu<span className="text-brand-700">write</span>
                            </span>
                        </a>
                        <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">
                            Platform akuntansi cloud eksklusif untuk korporasi besar.
                            Solusi khusus, infrastruktur terdedikasi, intelijensi presisi.
                        </p>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([heading, links]) => (
                        <div key={heading}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                {heading}
                            </h3>
                            <ul className="mt-4 space-y-3" role="list">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-8">
                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} Hak Cipta Terpelihara. Accuwrite Enterprise Solutions.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            Pusat Keamanan
                        </a>
                        <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            SLA Publik
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
