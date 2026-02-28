"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User,
    Lock,
    Building2,
    UserCircle,
    ArrowRight,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        companyName: "",
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [isSuccess, setIsSuccess] = useState(false);

    const passwordChecks = {
        length: form.password.length >= 8,
        hasUpper: /[A-Z]/.test(form.password),
        hasNumber: /[0-9]/.test(form.password),
    };

    const isPasswordValid =
        passwordChecks.length && passwordChecks.hasUpper && passwordChecks.hasNumber;

    const isStep1Valid = form.companyName.trim() !== "" && form.fullName.trim() !== "";
    const isStep2Valid =
        form.username.trim().length >= 3 &&
        isPasswordValid &&
        form.password === form.confirmPassword;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (isStep1Valid) setStep(2);
            return;
        }

        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Kata sandi tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName: form.companyName,
                    fullName: form.fullName,
                    username: form.username,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === "Username is already taken." ? "Nama pengguna sudah dipakai." : data.error || "Pendaftaran gagal. Silakan coba lagi.");
                return;
            }

            // Mencegah auto-login, tampilkan notifikasi berhasil
            setIsSuccess(true);
        } catch {
            setError("Tidak dapat terhubung. Periksa koneksi Anda.");
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="w-full max-w-md">
                <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="space-y-4 text-center pb-8 pt-8 px-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">Pendaftaran Berhasil!</CardTitle>
                            <CardDescription className="text-zinc-500 text-base">
                                Akun organisasi Anda telah berhasil dibuat. Silakan masuk untuk memulai.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
                        <Button asChild className="w-full text-base py-6 shadow-sm">
                            <Link href="/login">
                                Masuk Sekarang
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Buat Organisasi</CardTitle>
                    <CardDescription className="text-zinc-500">
                        Siapkan ruang kerja dan akun Owner Anda
                    </CardDescription>
                </CardHeader>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-6 px-6">
                    <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-blue-600 transition-all duration-300" />
                        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mt-1.5 uppercase tracking-wide">
                            1. Organisasi
                        </p>
                    </div>
                    <div className="flex-1">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-800"
                                }`}
                        />
                        <p
                            className={`text-[11px] font-bold mt-1.5 uppercase tracking-wide transition-colors ${step === 2 ? "text-blue-700 dark:text-blue-400" : "text-zinc-400"
                                }`}
                        >
                            2. Kredensial
                        </p>
                    </div>
                </div>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-company">Nama Organisasi</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            id="reg-company"
                                            type="text"
                                            placeholder="Contoh: PT. Maju Bersama"
                                            className="pl-9"
                                            value={form.companyName}
                                            onChange={(e) =>
                                                setForm({ ...form, companyName: e.target.value })
                                            }
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                                        Ini akan menjadi nama ruang kerja tim Anda
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-fullname">Nama Lengkap Anda</Label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            id="reg-fullname"
                                            type="text"
                                            placeholder="Contoh: Budi Santoso"
                                            className="pl-9"
                                            value={form.fullName}
                                            onChange={(e) =>
                                                setForm({ ...form, fullName: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!isStep1Valid}
                                    className="w-full mt-2"
                                >
                                    Lanjutkan
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-username">Nama Pengguna</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            id="reg-username"
                                            type="text"
                                            placeholder="Pilih nama pengguna (min. 3 kar)"
                                            className="pl-9"
                                            value={form.username}
                                            onChange={(e) =>
                                                setForm({ ...form, username: e.target.value })
                                            }
                                            required
                                            autoComplete="username"
                                            autoCapitalize="none"
                                            autoFocus
                                        />
                                    </div>
                                    {form.username.length > 0 && form.username.length < 3 && (
                                        <p className="text-xs text-red-500 font-medium">Minimal 3 karakter diperlukan</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Kata Sandi</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            id="reg-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Buat kata sandi yang kuat"
                                            className="pl-9 pr-10"
                                            value={form.password}
                                            onChange={(e) =>
                                                setForm({ ...form, password: e.target.value })
                                            }
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {form.password.length > 0 && (
                                        <div className="mt-2 space-y-1.5 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1">Syarat Kata Sandi:</p>
                                            {[
                                                { check: passwordChecks.length, label: "Minimal 8 karakter" },
                                                { check: passwordChecks.hasUpper, label: "Satu huruf besar (kapital)" },
                                                { check: passwordChecks.hasNumber, label: "Satu angka" },
                                            ].map((req) => (
                                                <div
                                                    key={req.label}
                                                    className="flex items-center gap-2 text-xs font-medium"
                                                >
                                                    <CheckCircle2
                                                        className={`w-3.5 h-3.5 ${req.check ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"
                                                            }`}
                                                    />
                                                    <span
                                                        className={
                                                            req.check ? "text-zinc-900 dark:text-zinc-200" : "text-zinc-500"
                                                        }
                                                    >
                                                        {req.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-confirm">Konfirmasi Kata Sandi</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            id="reg-confirm"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Masukkan ulang kata sandi"
                                            className="pl-9"
                                            value={form.confirmPassword}
                                            onChange={(e) =>
                                                setForm({ ...form, confirmPassword: e.target.value })
                                            }
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    {form.confirmPassword.length > 0 &&
                                        form.password !== form.confirmPassword && (
                                            <p className="text-xs text-red-500 font-medium">Kata sandi tidak cocok</p>
                                        )}
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading || !isStep2Valid}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Menyiapkan ruang kerja...
                                            </>
                                        ) : (
                                            <>
                                                Selesaikan Pendaftaran
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep(1)}
                                        className="w-full text-sm"
                                    >
                                        Kembali ke Organisasi
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 text-center mt-2">
                    <p className="text-sm text-zinc-500">
                        Sudah punya akun?{" "}
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors"
                        >
                            Masuk di sini
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
