import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/components/ProgressProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Motor Control Lab", template: "%s · Motor Control Lab" },
  description:
    "Learn EV motor control and power electronics by running it: 30 lessons with live simulations, quizzes, challenges, debugging cases and a real-time FOC drive lab.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ProgressProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ProgressProvider>
      </body>
    </html>
  );
}
