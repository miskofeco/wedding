import type { Request } from "./types";

// The wording is a draft to confirm with the couple, in particular the confetti rule
// (what is allowed, and where). Keep it in the order of the day.
export const requestsIntro =
  "Tri maličkosti, o ktoré vás prosíme, aby bol ten deň taký, aký si ho predstavujeme. Idú v poradí dňa.";

export const requests: Request[] = [
  {
    id: "skor",
    when: "Pred obradou",
    title: "Príďte radšej skôr",
    text: "Nájdete si miesto, nadýchnete sa a obrad začneme v pokoji všetci spolu.",
    drawing: "wedding-bells",
    tint: ["butter", "apricot"],
  },
  {
    id: "telefony",
    when: "Počas obradu",
    title: "Telefóny do vrecka",
    text: "Chceme vidieť vaše tváre, nie displeje. Po obrade si odfotíte, čo len budete chcieť.",
    drawing: "polaroids",
    tint: ["sage", "peony"],
  },
  {
    id: "konfety",
    when: "Po obrade",
    title: "Konfety s mierou",
    text: "Potešia nás prírodné lupene a lístky, nie plast a trblietky. Hádzať ich budeme vonku, nie v kostole.",
    drawing: "confetti",
    tint: ["peony", "butter"],
  },
];
