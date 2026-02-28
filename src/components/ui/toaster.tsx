"use client";

import { useEffect, useState } from "react";
import { useNotificationStore, Toast as ToastType } from "@/hooks/use-notification";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const toastIcons = {
    success: <CheckCircle2 className="size-5 text-success dark:text-success-light" />,
    error: <XCircle className="size-5 text-danger dark:text-danger-light" />,
    warning: <AlertCircle className="size-5 text-warning dark:text-warning-light" />,
    info: <Info className="size-5 text-brand-500" />
};

const toastColors = {
    success: "border-success bg-white dark:bg-slate-900 border",
    error: "border-danger bg-white dark:bg-slate-900 border",
    warning: "border-warning bg-white dark:bg-slate-900 border",
    info: "border-brand-500 bg-white dark:bg-slate-900 border",
};

const progressColors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-brand-500",
};

function ToastItem({ toast }: { toast: ToastType }) {
    const removeToast = useNotificationStore((state) => state.removeToast);
    const [progress, setProgress] = useState(100);
    const duration = toast.duration || 5000;

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (elapsed >= duration) {
                clearInterval(interval);
                removeToast(toast.id);
            }
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, [toast.id, duration, removeToast]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-lg shadow-lg pointer-events-auto",
                "max-w-[350px] sm:max-w-[400px]",
                toastColors[toast.type]
            )}
            role="alert"
        >
            <div className="flex items-start gap-3 p-4">
                <div className="shrink-0">{toastIcons[toast.type]}</div>
                <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                    {toast.message}
                </p>
                <button
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    aria-label="Close"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                    className={cn("h-full", progressColors[toast.type])}
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0 }} // Smoothness handled by interval
                />
            </div>
        </motion.div>
    );
}

export function Toaster() {
    const toasts = useNotificationStore((state) => state.toasts);

    return (
        <div className="fixed z-[100] flex flex-col gap-3 pointer-events-none sm:top-4 sm:bottom-auto sm:right-4 top-auto bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 w-[calc(100%-2rem)] sm:w-auto">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    );
}
