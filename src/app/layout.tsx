import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://solotype.vercel.app",
  ),
  title: {
    default: "SoloType — Minimalist Spaced Repetition Typing",
    template: "%s | SoloType",
  },
  description:
    "A minimalist touch typing web app featuring Spaced Repetition error optimization, Single Letter reflex drills, and Flash & Type visual memory training.",
  keywords: [
    "typing test",
    "touch typing",
    "spaced repetition typing",
    "typing speed test",
    "wpm test",
    "typing accuracy",
    "single letter drill",
    "flash typing",
    "monkeytype alternative",
    "developer typing practice",
    "mechanical keyboard sound",
    "hnamhocit",
    "solotype",
  ],
  authors: [
    {
      name: "hnamhocit",
      url: "https://github.com/hnamhocit",
    },
  ],
  creator: "hnamhocit",
  publisher: "hnamhocit",
  applicationName: "SoloType",
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SoloType — Minimalist Spaced Repetition Typing",
    description:
      "Master weak keys and vocabulary with Spaced Repetition, Single Letter reflex drills, and Flash & Type visual memory.",
    url: "https://solotype.vercel.app",
    siteName: "SoloType",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoloType — Minimalist Spaced Repetition Typing",
    description:
      "Master weak keys and vocabulary with Spaced Repetition, Single Letter reflex drills, and Flash & Type visual memory.",
    creator: "@hnamhocit",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "any" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SoloType",
  alternateName: "SoloType Typing Trainer",
  url: "https://solotype.vercel.app",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  inLanguage: "en",
  description:
    "A minimalist touch typing web app featuring Spaced Repetition error optimization, Single Letter reflex drills, and Flash & Type visual memory training.",
  browserRequirements: "Requires JavaScript. Requires modern HTML5 browser.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "hnamhocit",
    url: "https://github.com/hnamhocit",
  },
  featureList: [
    "Spaced Repetition Error Decay & Debt Management",
    "Single Letter Weak Key Reflex Drills",
    "Flash & Type Visual Working Memory Practice",
    "Hand Isolation (Left-hand / Right-hand only)",
    "Realistic Mechanical Switch Audio (Creamy Thock, Box Clicky, Bubble Pop)",
    "6 Curated Light and Dark Ergonomic Color Themes",
    "Zero Backspace Mode for Unbroken Typing Flow",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </head>
      <body className="min-h-full flex flex-col font-mono selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-primary)]">
        {children}
      </body>
    </html>
  );
}
