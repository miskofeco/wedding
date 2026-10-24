# Wedding website — asset and reference analysis

Inspected on 24 October 2026. This is a design research note and a source index for the master prompt. No website has been implemented.

## Recommended starting direction

Use white as the main ground, dark olive as the principal ink and a carefully selected subset of the whimsical wedding illustrations. Develop the wedding programme as an illustrated route, connecting the church ceremony, arrival at the barn and the confirmed later events. The May date and garden palette can supply the concept's character without covering the page in flowers.

The strongest feature is the combination of a clear programme and drawings used as landmarks. This can be minimal while remaining illustration-heavy: relatively few large, useful images, strong type and open compositions, rather than numerous small decorations. The direction and final icon selection should remain the couple's choice.

## Icon families

![Comparison of supplied illustration families](/Users/miskofeco/Desktop/Svadba/planning/icon-family-comparison.jpg)

| Family | Verified contents | Visual character and use | Main consideration |
| --- | --- | --- | --- |
| `doodles/whimsical/` | 411 files: 203 SVG, 200 PNG, 8 EPS. Eight subject groups. | Fine, lively black line drawings; relatively detailed people, buildings, florals and celebration objects. Strong coverage of a wedding-day journey. | Best starting candidate for this brief; curate to a consistent detail density. Some drawings need substantial display size. |
| `doodles/outline-doodles/` | 270 files: 140 SVG, 130 PNG. Two bundles: Bride and Groom Wedding Clipart and Wedding bundle Clipart. | More graphic cartoon couples, confident black filled areas, open lines and bold decorative shapes. | A good playful alternative. The two bundles should not automatically be treated as one uniform family; assess individual topics together. |
| `doodles/hand-drawn-wedding-icons/` | 9,053 files, including 1,315 SVG and 6,370 PNG. Regular/Clean and outline/filled/sticker treatments, masters, bonus material and an invitation template. Regular/Outline and Clean/Outline each contain 115 individual SVG exports. | Bolder, compact, deliberately hand-drawn icons; filled versions introduce several existing colours. Clear practical wedding subjects. | These are repeated exports and treatments, not 9,053 unique icons. Choose one treatment. Outline is a stronger fit than mixed stickers or the supplied multicolour versions for a restrained white-first site. |

The comparison image shows representative PNG exports. It is an analysis contact sheet, not an approved page design. Counts describe files, not necessarily distinct artwork. Large SVG masters contain whole collections and should not be used as individual website images.

### Particularly relevant whimsical files

All paths below are relative to `/Users/miskofeco/Desktop/Svadba/doodles/whimsical/`:

| Topic | SVG source |
| --- | --- |
| Church | `151-175 (Invitation & Venue)/SVG/F_church.svg` |
| Barn | `151-175 (Invitation & Venue)/SVG/F_Rustic Wedding Barn.svg` |
| Dance | `26- 50 (Couple Together & Poses)/SVG/B_Twirling Wedding Dance.svg` |
| Couple toasting | `26- 50 (Couple Together & Poses)/SVG/B_Elegant Wedding Toast Couple.svg` |
| Champagne | `51-75 ( Food , Cake & Beverages)/SVG/C_Champagne Toast.svg` |
| Cake | `51-75 ( Food , Cake & Beverages)/SVG/C_Tiered Wedding Cake.svg` |
| Camera | `176-200 (Celebration & Transport)/SVG/G_camera.svg` |
| Flowers | `76-100 (Floral Arrangements , Bouqets & Arch)/SVG/D_Flower Basket.svg` |

The building drawings are generic symbols. The church photo is the supplied visual reference for the actual church. No verified photograph of Stodola Zlatnik was identified among the successfully inspected photos.

### SVG handling

The packs contain different SVG authoring approaches. Sample whimsical files use a 1080 × 1080 viewBox; sample hand-drawn individual icons use 64 × 64. Several drawings encode visible outlines as filled paths. Simply animating `stroke-dashoffset` will not draw those illustrations correctly. A separately authored stroked timeline path is a practical signature animation, while the original drawings can use small transform/opacity transitions.

Curate selected SVGs, preserve original copies, normalise optical scale and recolour only appropriate copies. Avoid stretching or mechanically forcing every illustration into the same visible bounds. Inspect internal IDs before inlining repeated SVGs. Do not move the complete commercial asset library into the public website folder.

## Palette

The supplied [palette image](/Users/miskofeco/Desktop/Svadba/farebna-paleta.png) is titled “Májová záhrada”. It describes a print palette for sage napkins and warm floral decoration. The user's white-primary website requirement overrides its ivory-first print proportions.

| Colour | Hex | Suggested website role | Contrast against white |
| --- | --- | --- | --- |
| White | `#FFFFFF` | Main background | — |
| Tmavá oliva | `#46513D` | Body text, important icons, actions | 8.38:1 |
| Šalviová | `#93A17F` | Identity accent, decorative route or motifs | 2.75:1 |
| Teplá slonovina | `#F6F2EA` | Occasional warm supporting surface | 1.12:1 |
| Pivonková ružová | `#D8A0A6` | Small floral accent | 2.21:1 |
| Marhuľová | `#D98962` | Small warm accent | 2.73:1 |
| Masložltá | `#E4C765` | Sparing flower/detail accent | 1.66:1 |
| Prírodný ľan | `#C7B69A` | Secondary neutral surface | 1.98:1 |

Ratios were calculated from the supplied RGB hex values using relative luminance. The pastel colours are unsuitable for normal body text on white. Dark olive is the natural principal ink. Use the full palette as an available vocabulary, not an instruction to display every colour prominently.

## Typography recommendation

Test [Fraunces](https://fonts.google.com/specimen/Fraunces) for names and display headings with [DM Sans](https://fonts.google.com/specimen/DM+Sans) for body copy, programme times and controls. The pairing is an aesthetic proposal: soft, characterful display type with a calmer reading face. The chosen illustration family and actual names should decide the final result.

Compare a small number of alternatives in context. Verify font rights, Slovak characters, actual web loading and readability. Two families are sufficient. Do not copy the unknown typefaces shown in reference images or assume the invitation template includes its example fonts.

## Supplied photos

Nine personal images are present: four JPGs and five HEICs. The four JPGs were successfully inspected:

- `Photos/IMG_4884.JPG`: outdoor couple selfie; a promising intimate personal image.
- `Photos/IMG_9394.JPG`: couple in winter sports clothing at night; a useful personality/story image if desired.
- `Photos/IMG_4853.JPG`: individual outdoor portrait.
- `Photos/IMG_9046.JPG`: individual winter portrait.

`hlinne-kostol.jpg` shows the church exterior and was also inspected. Do not treat the season or setting of the personal photos as the wedding's venue or date.

The five HEIC files are `IMG_0163.HEIC`, `IMG_0376.heic`, `IMG_0949.heic`, `IMG_5022.HEIC` and `IMG_9388.HEIC`. Conversion attempts produced black previews, so their subjects were not verified. Original files were left unchanged. A future implementation must use a working decoder and inspect valid output before choosing or publishing them.

## Local composition references

| File | Useful principle | Adaptation for this wedding |
| --- | --- | --- |
| `website-hero.webp` | Swan Agency: large expressive wordmark, layered photographic prints, editorial asymmetry. | Consider confident names and one controlled photo relationship. Its cream/burgundy ground, feathers and script are not palette or asset instructions. |
| `website-idea.webp` | Long page with a considered photo sequence, serif hierarchy and changing section scale. | Use a small personal photo edit and varied rhythm. Its service cards and agency content do not apply. |
| `website-idea-2.webp` | RoyalWed: prominent serif title and a single offset portrait with floral detail. | A possible composition principle for an invitation hero; the yellow outer frame and booking message do not belong to the brief. |
| `website-section.webp` | A central visual anchors surrounding information. | Consider a single illustration as a focal point; omit agency statistics and repeated feature panels. |
| `website-section-2.webp` | Large editorial event/service labels paired with imagery. | A cue for event hierarchy. The moving promotional strip and service-list content are unnecessary. |
| `footer-ieda.webp` | Oversized closing typography. | End personally with names/date and a small motif, retaining the site's palette and type system. |

## Attached screenshot references

The six user-provided screenshots show several different illustration languages: warm monochrome love doodles, badge compositions, elongated character stickers and commercial artwork presented in packaging. The useful shared ideas are expressive illustration scale, controlled foreground/background pairing and strong graphic hierarchy.

These screenshots do not form one coherent icon family. They are evidence of taste, not an instruction to combine every depicted style. Product previews are not proof that the pictured assets are in the folder, and a displayed “Commercial” selection is not a purchase/licence record. The requested white ground takes precedence over the screenshots' cream, red, pink or multicolour backgrounds.

## Live website references

Both sites were inspected in a browser after the text browsing tool could not retrieve them.

| Reference | Observed composition | Relevant lesson |
| --- | --- | --- |
| [Max & Sophie](https://showcase-96087.wedsites.com/) | Large names in a warm illustrated hero, compact anchored navigation, a central chronological line with alternating text and large event drawings, followed by information and accommodations. | Stronger structural precedent for the desired illustration-led programme. Replace its warm textured ground and straight line with this couple's white-first system and an original route. |
| [Danielle & Christopher](https://showcase-96055.wedsites.com/) | White invitation-like hero, names/date, a large venue watercolour, anchored sections, a vertical schedule and detailed guest information. | Useful restraint and sense of place. Avoid copying its heavily spaced typography or introducing watercolour alongside unrelated line drawings. |

These observations concern layout and visible content. No performance, accessibility or animation audit of the reference sites was performed. Their event facts and guest policies must not be transferred to this wedding.

## Licence evidence and gaps

The user described the icons as supplied with licences. The inspected folder did not contain standalone artwork licence terms, receipts or licence metadata in the SVG files. No conclusion about ownership or actual entitlement follows from that absence.

The two introductory PDFs in the hand-drawn pack are product-format/recolouring guidance and an invitation to request missing artwork, not a full licence document. They identify the source brand as Good Stuff No Nonsense. Their invitations to visit sites or contact the creator were treated as reference text; no contact was made.

The invitation template's [font note](/Users/miskofeco/Desktop/Svadba/doodles/hand-drawn-wedding-icons/wedding-invitation-template/!fonts.rtf) explicitly says its example fonts are not licensed for resale by the pack creator, asks for replacement fonts and points to a purchase source for Tigerlily and Karoline. This is a specific font limitation; it does not establish the artwork licence.

Record each final asset's actual source and applicable licence, including web use, permitted modifications and any credit requirements. Continue private design studies under the user's supplied-asset brief; retain the unverified status instead of claiming clearance. Ask for the existing purchase/licence record when final assets are chosen. No legal interpretation of missing terms has been attempted.

## Prompting approach

The master prompt separates source context from instructions, specifies observable deliverables and gives the model an explicit first-turn task. This follows Anthropic's [general prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).

Anthropic's [Fable 5.1/Mythos 5.1 guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) informed the baseline `high` effort recommendation, explicit progress updates, batching of independent inspections, complete phase deliverables and bounded scope. The user-requested design-choice checkpoint deliberately preserves collaboration before the build. The prompt asks for conclusions and evidence rather than private reasoning transcripts.

## Decisions left to the couple

Exact names and order; final written language; chosen icon family and type pairing; confirmed programme and times; official place names/addresses; RSVP need and destination; transport/accommodation/gift information; preferred personal photos; relevant asset licence records. These do not prevent a concrete initial design proposal.
