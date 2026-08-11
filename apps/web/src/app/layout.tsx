import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AccentProvider, AccentScript } from "@/components/site/accent";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--web-font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--web-font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Runs before first paint, ahead of hydration, so a returning
            visitor's stored accent is on screen for the very first frame
            instead of flashing `sun` and correcting itself afterwards. */}
        <AccentScript />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AccentProvider>{children}</AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
