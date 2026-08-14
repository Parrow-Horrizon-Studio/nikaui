import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AccentProvider, AccentScript } from "@/components/site/accent";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { SITE } from "@/lib/site";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { template: "%s | Nika UI", default: SITE.title },
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
};

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
          <AccentProvider>
            {/* Fumadocs' RootProvider wraps next-themes internally. C already
                mounts next-themes via ThemeProvider, and two providers
                contending for one `.dark` class is a real conflict — so this
                one runs with theming off and supplies only the search-dialog
                and sidebar context the docs layout needs. `enabled` is
                first-class API: see ThemeOptions in
                fumadocs-ui/dist/provider/base.d.ts.

                Side effect: Fumadocs' `d` hotkey for toggling the theme goes
                away with it. C's toggle is the only theme control. */}
            <RootProvider theme={{ enabled: false }}>
              <Nav />
              {children}
              <Footer />
            </RootProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
