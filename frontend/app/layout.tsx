import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Morpheus — Autonomous SRE Agent',
  description: 'AI-powered incident detection, investigation, and resolution',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0A0E17] text-[#E8EDF5] antialiased">
        {children}
      </body>
    </html>
  );
}
