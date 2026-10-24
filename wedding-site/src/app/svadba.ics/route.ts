import { icsFile } from "@/lib/calendar";

// Built once at deploy time; rebuilt whenever the content changes.
export const dynamic = "force-static";

export function GET() {
  return new Response(icsFile(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="svadba-barbora-michal.ics"',
    },
  });
}
