"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User,
    Lock,
    ArrowRight,
    LogIn,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === "Invalid credentials." ? "Kredensial tidak valid." : data.error || "Gagal masuk. Silakan coba lagi.");
                return;
            }

            // Store token based on truxos pattern
            localStorage.setItem("accuwrite_token", data.token);
            localStorage.setItem("accuwrite_user", JSON.stringify(data.user));
            localStorage.setItem("accuwrite_tenant", JSON.stringify(data.tenant));

            // Redirect to workspace
            router.push(`/dashboard`);
        } catch {
            setError("Tidak dapat terhubung. Periksa koneksi Anda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900 border border-blue-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Selamat Datang</CardTitle>
                    <CardDescription className="text-zinc-500">
                        Masuk ke workspace Accuwrite Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-500 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="login-username">Nama Pengguna</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <Input
                                    id="login-username"
                                    type="text"
                                    placeholder="Masukkan nama pengguna Anda"
                                    className="pl-9"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login-password">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <Input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan kata sandi Anda"
                                    className="pl-9 pr-10"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Masuk...
                                </>
                            ) : (
                                <>
                                    Masuk
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center mt-2">
                    <p className="text-sm text-zinc-500">
                        Baru di Accuwrite?{" "}
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors"
                        >
                            Buat organisasi baru
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
