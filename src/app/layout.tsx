import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ahenk Yapı",
  description: "Yapı ve dekorasyon yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
