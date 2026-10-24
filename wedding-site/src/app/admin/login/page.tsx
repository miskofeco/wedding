import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { site } from "@/content";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: `Prihlásenie · ${site.couple.mark}` };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="obsah" className="admin-login">
      <div className="admin-login__card">
        <p className="admin-mark">{site.couple.mark}</p>
        <h1>Odpovede hostí</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="admin-note">
            Prihlásenie ešte nie je nastavené. Doplňte premenné <code>ADMIN_PASSWORD</code> a{" "}
            <code>ADMIN_SESSION_SECRET</code> (aspoň 32 znakov) a stránku obnovte.
          </p>
        )}
      </div>
    </main>
  );
}
