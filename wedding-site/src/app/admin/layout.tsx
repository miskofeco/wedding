// The admin has its own stylesheet; the guest pages never load it.
import "@/styles/admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
