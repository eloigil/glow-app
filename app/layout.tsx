import type { Metadata, Viewport } from "next";
import { Geist, Unbounded } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "GlowApp",
  description: "Makeup made for your skin, taught step by step on your own face.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#141116" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-ink">
        <MotionProvider>
          <SessionProvider>
            <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">{children}</main>
          </SessionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
