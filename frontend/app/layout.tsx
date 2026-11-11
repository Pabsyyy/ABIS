import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ABIS — Integrated Barangay Information System',
  description: 'Integrated Barangay Information System for Barangay Ambucao, Santiago, Ilocos Sur',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  );
}
