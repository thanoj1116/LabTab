import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "LabLink — Campus Laboratory Resource Sharing",
  description:
    "GenAI-powered campus laboratory resource-sharing platform that helps students discover and access specialized equipment, development kits and workstations across departments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong>LabLink</strong> — Campus Equipment Federation & Intelligent Slot Allocation MVP
            </p>
            <p className="text-slate-400">
              Deterministic Engine Decides • Gemini Understands & Explains
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
