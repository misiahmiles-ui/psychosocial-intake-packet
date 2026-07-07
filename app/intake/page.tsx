import { IntakeApp } from "@/components/IntakeApp";
import { ProtectedAccess } from "@/components/auth/ProtectedAccess";

export default function IntakePage() {
  return (
    <ProtectedAccess>
      <IntakeApp />
    </ProtectedAccess>
  );
}
