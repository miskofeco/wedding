// The admin forms reuse the RSVP form styles; neither sheet loads on the guest pages.
import "@/styles/rsvp.css";
import "@/styles/admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
