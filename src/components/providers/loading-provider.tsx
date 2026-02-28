"use client";

import { GlobalLoader } from "@/components/ui/global-loader";

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <GlobalLoader />
        </>
    );
}
