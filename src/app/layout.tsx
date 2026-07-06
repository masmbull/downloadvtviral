import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
  title: {
    default: "DownloadVTViral - Free Instagram & TikTok Video Downloader",
    template: "%s | DownloadVTViral",
  },
  description:
    "Download Instagram Reels, Posts, and TikTok videos without watermark. Fast, free, and mobile-friendly.",
  keywords: [
    "instagram video downloader",
    "tiktok video downloader",
    "download reels",
    "no watermark",
    "free video downloader",
  ],
  authors: [{ name: "DownloadVTViral" }],
  openGraph: {
    title: "DownloadVTViral - Free Instagram & TikTok Video Downloader",
    description: "Download Instagram Reels, Posts, and TikTok videos without watermark.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DownloadVTViral - Free Instagram & TikTok Video Downloader",
    description: "Download Instagram Reels, Posts, and TikTok videos without watermark.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="light" storageKey="downloadvtviral-theme">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
