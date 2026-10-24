import { ViewTransition } from "react";
import { site } from "@/content";
import { Nav } from "@/components/Nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav mark={site.couple.mark} />
      {/* Home ↔ /rsvp crossfade (240 ms, motion.css); the nav sits outside, so it stays put. */}
      <ViewTransition>{children}</ViewTransition>
    </>
  );
}
