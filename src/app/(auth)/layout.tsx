import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 opacity-40 dark:opacity-20"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 sm:p-6">
                <Link href="/" className="inline-flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-shadow duration-300">
                        <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                            Accu<span className="text-blue-600 dark:text-blue-500">write</span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-[0.15em] leading-none mt-0.5">
                            Platform Keuangan
                        </span>
                    </div>
                </Link>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-4 sm:p-6 text-center">
                <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                    &copy; {new Date().getFullYear()} Accuwrite. Hak cipta dilindungi undang-undang.
                </p>
            </footer>
        </div>
    );
}
