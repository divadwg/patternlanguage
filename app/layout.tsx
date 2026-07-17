import type { Metadata } from 'next';
import { DM_Mono, DM_Sans, EB_Garamond } from 'next/font/google';
import './globals.css';

const din = DM_Sans({
  variable: '--font-din',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const dinMono = DM_Mono({
  variable: '--font-din-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const garamond = EB_Garamond({
  variable: '--font-garamond',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'A Pattern Language — a universal map of urban patterns',
  description:
    "Christopher Alexander's 253 patterns joined by patterns extracted from Jane Jacobs, Jan Gehl, Kevin Lynch, William Whyte and other urban theorists — one connected, browsable map of how places work.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${din.variable} ${dinMono.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
