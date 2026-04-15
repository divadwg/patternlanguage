import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const din = DM_Sans({
  variable: "--font-din",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const dinMono = DM_Mono({
  variable: "--font-din-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "A Pattern Language",
  description:
    "A modern, graph-based reimagining of Christopher Alexander's pattern language — explore 253 canonical patterns and add your own.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${din.variable} ${dinMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
