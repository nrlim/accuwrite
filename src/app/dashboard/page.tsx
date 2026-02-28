export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Ringkasan</h1>
                <p className="text-zinc-500">
                    Selamat datang kembali di dashboard keuangan Anda.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder for metrics */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Metrik {i}</h3>
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-2xl font-bold">Rp 0,00</div>
                            <p className="text-xs text-muted-foreground">
                                +0% dari bulan lalu
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
