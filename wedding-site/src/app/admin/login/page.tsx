import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin, MIN_PASSWORD } from "@/lib/auth";
import { site } from "@/content";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: `Prihlásenie · ${site.couple.mark}` };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="obsah" className="adm-login">
      <div className="adm-login__card">
        <p className="adm-mark">{site.couple.mark}</p>
        <h1>Svadobná administrácia</h1>
        <p className="adm-login__sub">Odpovede hostí, zoznam pozvaných a obsah webu.</p>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="adm-notice">
            Prihlásenie ešte nie je nastavené. Doplňte premenné <code>ADMIN_PASSWORD</code> (aspoň {MIN_PASSWORD} znakov) a{" "}
            <code>ADMIN_SESSION_SECRET</code> (aspoň 32 znakov) a stránku obnovte.
          </p>
        )}
      </div>
    </main>
  );
}
