import type { Metadata } from "next";
import { OwnerControlCenter } from "@/components/owner/OwnerControlCenter";

export const metadata: Metadata = {
  title: "Owner Control Center | Adult Day Intake Pro",
  description:
    "Product Owner / Super Administrator review area for Adult Day Intake Pro."
};

export default function OwnerPage() {
  return <OwnerControlCenter />;
}
