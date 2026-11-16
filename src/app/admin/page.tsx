import type { Metadata } from "next";
import AdminWorkspace from "@/components/admin/AdminWorkspace";
import "../yonetim/admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false, nocache: true },
};
export default function AdminPage() { return <AdminWorkspace />; }
