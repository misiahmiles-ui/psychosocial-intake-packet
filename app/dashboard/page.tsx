import type { Metadata } from "next";
import { DashboardClient } from "@/components/auth/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Adult Day Intake Pro™",
  description: "Protected Adult Day Intake Pro™ workflow dashboard."
};

export default function DashboardPage() {
  return <DashboardClient />;
}
