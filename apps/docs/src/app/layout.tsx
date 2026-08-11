import { RootProvider } from "fumadocs-ui/provider/next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--docs-font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--docs-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Nika UI",
    default: "Nika UI — Unleash your UI",
  },
  description:
    "Beautiful, animated components built with Tailwind CSS and Motion. Install individually via CLI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <RootProvider theme={{ defaultTheme: "dark" }}>
          <Header />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
