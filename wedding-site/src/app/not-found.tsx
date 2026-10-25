import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";
import { art } from "@/lib/art";
import { Nav } from "@/components/Nav";
import { Tint } from "@/components/Tint";

export const metadata: Metadata = {
  title: `Stránka sa nenašla · ${site.couple.first} & ${site.couple.second}`,
};

/** A mistyped link from a message lands here: the invitation's nav, one drawing and the way back. */
export default function NotFound() {
  return (
    <>
      <Nav mark={site.couple.mark} />
      <main id="obsah" className="oops">
        <Tint className="oops__art" src={art("ranunculus-bouquet", "black")} c="linen" c2="butter" eager reveal={false} />
        <h1>Táto stránka neexistuje.</h1>
        <p className="lead">Možno ste sa pomýlili v&nbsp;adrese. Pozvánka je o&nbsp;krok späť.</p>
        <Link className="btn btn--solid" href="/">
          Späť na pozvánku
        </Link>
      </main>
    </>
  );
}
