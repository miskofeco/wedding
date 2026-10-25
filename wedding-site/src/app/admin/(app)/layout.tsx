import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";
import { requireAdmin } from "@/lib/auth";
import { daysUntil } from "@/lib/records";
import { AdminNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/admin/Icon";
import { SyncButton } from "@/components/admin/SyncButton";
import { logout } from "../actions";
import { loadBoard } from "../data";

export const metadata: Metadata = { title: { template: `%s · ${site.couple.mark}`, default: `Prehľad · ${site.couple.mark}` } };

/** The signed-in shell: an ink sidebar on desktop, a tab bar on phones. */
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const board = await loadBoard();
  const days = daysUntil(site.date);
  const badges = {
    "/admin/odpovede": board.summary.answers,
    "/admin/pozvani": board.summary.waitingHouseholds,
  };

  return (
    <div className="adm">
      <aside className="adm-side" aria-label="Administrácia">
        <div className="adm-side__brand">
          <Link className="adm-mark" href="/admin">
            {site.couple.mark}
          </Link>
          <p className="adm-side__date">
            {site.dateLabel}
            <span>{days > 1 ? `o ${days} dní` : days === 1 ? "zajtra" : days === 0 ? "dnes" : "po svadbe"}</span>
          </p>
        </div>
        <AdminNav badges={badges} />
        <div className="adm-side__foot">
          <SyncButton configured={board.sheet.configured} pending={board.sheet.pending} url={board.sheet.url} />
          <Link className="adm-side__link" href="/" target="_blank">
            <Icon name="globe" />
            Zobraziť web<span className="sr-only"> (otvorí sa v novom okne)</span>
          </Link>
          <form action={logout}>
            <button className="adm-side__link" type="submit">
              <Icon name="logout" />
              Odhlásiť sa
            </button>
          </form>
        </div>
      </aside>
      <div className="adm-main" id="obsah">
        {children}
      </div>
    </div>
  );
}
