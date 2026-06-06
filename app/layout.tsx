import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konnerad — Selected Works",
  description: "Portfolio of selected projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" style={{ background: '#F4F4F4', color: '#111111', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
