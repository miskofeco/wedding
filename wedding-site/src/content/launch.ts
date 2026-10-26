/**
 * While true, the production site shows only the „Pripravujeme“ page (src/app/pripravujeme):
 * next.config.ts rewrites every guest page there (decided at build time). /admin stays open. Local dev and preview deploys
 * always show the full site. SITE_VARIANT=test also shows the full site, behind
 * the password gate, even in Production. Set to false and deploy to open the invitation.
 */
export const comingSoon = true;
