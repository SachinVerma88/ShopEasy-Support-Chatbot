import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopEasy Support Chat',
  description: 'AI-powered live chat support for ShopEasy e-commerce',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
