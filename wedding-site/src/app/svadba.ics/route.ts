import { icsFile } from "@/lib/calendar";
import { getSiteContent } from "@/lib/content";

// Built once at deploy time; rebuilt when the content changes in /admin.
export const dynamic = "force-static";

export async function GET() {
  return new Response(icsFile(await getSiteContent()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="svadba-barbora-michal.ics"',
    },
  });
}
