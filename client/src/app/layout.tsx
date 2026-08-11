import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import ReactQueryProvider from "@/lib/queryClient";
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SmartLib - Library Management System",
  description: "Modern, professional library management system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Surface (light vs dark) is decided per route-group layout, not globally
  // here - member/public routes default light, staff/admin routes default
  // dark. See (member)/layout.tsx, (librarian)/layout.tsx, (admin)/layout.tsx,
  // (auth)/layout.tsx.
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} antialiased`}>
      <body>
        <ReactQueryProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                borderRadius: '0',
                background: 'var(--color-signal-surface-dark)',
                color: 'white',
                border: '1px solid var(--color-signal-border-dark)',
                fontFamily: 'var(--font-mono)'
              }
            }} 
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
