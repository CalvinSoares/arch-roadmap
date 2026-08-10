import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/context/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devatlas.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DevAtlas — estude padrões e arquitetura visualmente",
    template: "%s · DevAtlas",
  },
  description:
    "Roadmaps enxutos e um catálogo visual de design patterns, princípios e arquitetura, com diagramas, camadas navegáveis e demos interativas.",
  openGraph: {
    type: "website",
    siteName: "DevAtlas",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
