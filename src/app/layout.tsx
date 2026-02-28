import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Accuwrite — Precision Cloud Accounting",
  description:
    "Accuwrite is a modern cloud accounting platform built for precision financial reporting. Real-time journaling, multi-tenant support, and seamless integrations with operational systems.",
  keywords: [
    "cloud accounting",
    "financial reporting",
    "general ledger",
    "profit and loss",
    "real-time journaling",
    "multi-tenant accounting",
    "API integration",
    "SaaS accounting",
  ],
  openGraph: {
    title: "Accuwrite — Precision Cloud Accounting",
    description:
      "Modern cloud accounting built for precision. Real-time journaling, automated financial statements, and seamless operational integrations.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
