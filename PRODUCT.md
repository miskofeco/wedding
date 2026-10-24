# PRODUCT.md — Svadba 29. 05. 2027

Durable product context for the wedding website. Written 24 Oct 2026 from the couple's brief; items marked *(assumption)* await confirmation. Visual decisions are locked in DESIGN.md (24 Oct 2026); the app is `wedding-site/`.

## What this is
A single-page wedding invitation and guest guide for the couple's own wedding on **Saturday 29 May 2027**. Church ceremony in **Hlinné** (okres Vranov nad Topľou), reception at **Stodola Zlatník** (a barn with garden, pond and flowers). Built with Next.js (App Router, TypeScript), deployed later to Vercel.

## Who reads it
Invited guests, mostly Slovak-speaking family and friends *(assumption: Slovak is the single site language)*. Many will open it on a phone from a link in a message. They already know who is getting married; they want to feel welcomed and to find the plan, the places and practical details without effort.

## What they should believe after one screen
"We are personally invited, we know when and where, and the day's plan is one tap away."

## What they do next
Read the programme; find the two places (map links); check practical information. Possibly RSVP *(not confirmed: fields, destination and deadline unknown)*.

## Mode
Persuade with a Read core: the hero earns warmth and attention; the programme and information must be scannable without interaction.

## Hard constraints from the couple
- White #FFFFFF is the primary ground; palette „Májová záhrada“ (`farebna-paleta.png`) supports it.
- One illustration family and treatment; one typography pairing; one connected chronological programme with a visible path.
- Purposeful motion only; reduced-motion and no-JS states show the full programme.
- Never invent times, addresses, travel durations or traditions; use „Čas upresníme“ until confirmed.
- Do not deploy or publish as part of the design task.

## Open facts
Names and order; exact church (Hlinné has Greek Catholic, Roman Catholic and Evangelical churches per sk.wikipedia); ceremony time; official venue name, address and timings; confirmed programme; RSVP need; transport, accommodation, gifts, dietary, album; asset licence records; preferred photos.

## Assets
Illustration packs in `doodles/` (licence terms not located in the folders), nine personal photos in `Photos/` (all decode correctly with `sips`), church photo `hlinne-kostol.jpg`, reference images, prior audit `WEDDING-ASSET-ANALYSIS.md`, Phase 1 board `planning/direction-board/`.
