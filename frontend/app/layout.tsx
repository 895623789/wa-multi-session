import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Manrope } from "next/font/google";
import "./globals.css";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import { ThemeProvider } from "@/lib/ThemeContext";
import { ToastContainer } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "BulkReply.io | AI WhatsApp Manager",
  description: "Next-gen AI WhatsApp marketing and automated management.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BulkReply",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${manrope.className} ${outfit.variable} ${inter.variable} font-display page-bg min-h-screen antialiased`}>
        <ThemeProvider>
          <AuthProviderWrapper>{children}</AuthProviderWrapper>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
