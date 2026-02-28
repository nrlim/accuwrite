"use client";

import { useLoading } from "@/hooks/use-loading";
import { AnimatePresence, motion } from "framer-motion";

export function GlobalLoader() {
    const { isLoading, message } = useLoading();

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm dark:bg-slate-900/40"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="flex items-center justify-center"
                        >
                            <div className="text-3xl font-bold tracking-tighter text-brand-600 dark:text-brand-400 drop-shadow-sm">
                                Accuwrite
                            </div>
                        </motion.div>
                        {message && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                {message}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
