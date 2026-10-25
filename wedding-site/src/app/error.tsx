"use client";

import Link from "next/link";
import { site } from "@/content";
import { art } from "@/lib/art";
import { Nav } from "@/components/Nav";
import { Tint } from "@/components/Tint";

/** Anything that breaks while a page renders. Shows no details; the server log has them. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <Nav mark={site.couple.mark} />
      <main id="obsah" className="oops">
        <Tint className="oops__art" src={art("ranunculus-bouquet", "black")} c="peony" c2="butter" eager reveal={false} />
        <h1>Niečo sa pokazilo.</h1>
        <p className="lead">Stránka sa nenačítala celá. Skúste to, prosím, znova.</p>
        <div className="oops__actions">
          <button className="btn btn--solid" type="button" onClick={reset}>
            Skúsiť znova
          </button>
          <Link className="btn" href="/">
            Späť na pozvánku
          </Link>
        </div>
      </main>
    </>
  );
}
