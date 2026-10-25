import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { site } from "@/content";
import { AnchorScroll } from "@/components/AnchorScroll";
import { RevealObserver } from "@/components/RevealObserver";
import { bootScript } from "@/lib/boot";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/sections.css";
import "@/styles/motion.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-dm-sans",
});

const names = `${site.couple.first} & ${site.couple.second}`;

export const metadata: Metadata = {
  title: `${names} · ${site.dateLabel}`,
  description: site.description,
  // A private invitation: keep it out of search engines.
  robots: { index: false, follow: false },
  openGraph: {
    title: names,
    description: `${site.dateLabel} · Hlinné · Zlatník`,
    locale: "sk_SK",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={`${fraunces.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip" href="#obsah">
          Preskočiť na obsah
        </a>
        {/* Sticker filter: a thin white outline around the black line art, no fill (blur + threshold keeps the edge round, unlike a square morphology kernel). */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
          <filter id="sticker" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="soft" />
            <feComponentTransfer in="soft" result="wide"><feFuncA type="linear" slope="40" /></feComponentTransfer>
            <feGaussianBlur in="wide" stdDeviation="1.8" result="round" />
            <feComponentTransfer in="round" result="cut"><feFuncA type="linear" slope="12" intercept="-5" /></feComponentTransfer>
            <feFlood floodColor="#ffffff" />
            <feComposite in2="cut" operator="in" result="edge" />
            <feMerge>
              <feMergeNode in="edge" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sticker-lg" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="soft" />
            <feComponentTransfer in="soft" result="wide"><feFuncA type="linear" slope="40" /></feComponentTransfer>
            <feGaussianBlur in="wide" stdDeviation="1.8" result="round" />
            <feComponentTransfer in="round" result="cut"><feFuncA type="linear" slope="12" intercept="-5" /></feComponentTransfer>
            <feFlood floodColor="#ffffff" />
            <feComposite in2="cut" operator="in" result="edge" />
            <feMerge>
              <feMergeNode in="edge" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </svg>
        {children}
        <RevealObserver />
        <AnchorScroll />
      </body>
    </html>
  );
}
