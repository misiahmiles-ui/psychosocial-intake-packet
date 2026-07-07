import type { Metadata } from "next";
import { DashboardClient } from "@/components/auth/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Adult Day Intake Pro",
  description: "Protected Psychosocial Intake Packet dashboard."
};

export default function DashboardPage() {
  return <DashboardClient />;
}
