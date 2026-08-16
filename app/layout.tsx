import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClassFit NYC",
  description:
    "Understand and address NYC public school overcrowding under the class size mandate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white sticky top-0 z-[1000]">
            <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">ClassFit NYC</span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Class size mandate compliance explorer
                </span>
              </Link>
              <nav className="text-sm text-slate-600 flex gap-4">
                <Link href="/" className="hover:text-slate-900">
                  Map &amp; Search
                </Link>
                <Link href="/admin-guide" className="hover:text-slate-900">
                  Administrator Guide
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
