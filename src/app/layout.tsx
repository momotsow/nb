import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { siteUrl } from "@/lib/seo";
import { Footer } from "@/ui/shell/Footer";
import { Header } from "@/ui/shell/Header";
import { SkipLink } from "@/ui/shell/SkipLink";
import { THEME_INIT_SCRIPT } from "@/ui/shell/theme";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// PROVISIONAL (decision log D-02): Brand Bible names Manrope; the scaffold used DM Sans.
// Font choice and licensing stay provisional until design sign-off.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const description =
  "Thoughtfully created self-care experiences and beautiful gifts for the moments that matter.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Ndalo Bloom", template: "%s | Ndalo Bloom" },
  description,
  // Open Graph defaults (R8.3). No image yet: the final logo/share asset is a sign-off item (R7.3).
  openGraph: {
    type: "website",
    siteName: "Ndalo Bloom",
    title: "Ndalo Bloom",
    description,
    locale: "en_ZA",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the init script sets data-theme before hydration.
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <Header />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
