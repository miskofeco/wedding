/**
 * While true, the production site shows only the „Pripravujeme“ page (src/app/pripravujeme):
 * src/proxy.ts sends every guest page there. /admin stays open. Local dev and preview deploys
 * always show the full site. Set to false and deploy to open the invitation.
 */
export const comingSoon = true;
