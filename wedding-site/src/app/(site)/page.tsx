import { Hero } from "@/components/sections/Hero";
import { Milestone } from "@/components/sections/Milestone";
import { Programme } from "@/components/sections/Programme";
import { Places } from "@/components/sections/Places";
import { Requests } from "@/components/sections/Requests";
import { Journey } from "@/components/sections/Journey";
import { Palette } from "@/components/sections/Palette";
import { GoldenHour } from "@/components/sections/GoldenHour";
import { Photos } from "@/components/sections/Photos";
import { Stay } from "@/components/sections/Stay";
import { Faq } from "@/components/sections/Faq";
import { RsvpCta } from "@/components/sections/RsvpCta";
import { Closing } from "@/components/sections/Closing";

export default function Home() {
  return (
    <>
      <main id="obsah">
        <Hero />
        <Milestone />
        <Programme />
        <Places />
        <Requests />
        <Journey />
        <Palette />
        <GoldenHour />
        <Stay />
        <Faq />
        <RsvpCta />
        <Photos />
      </main>
      <Closing />
    </>
  );
}
