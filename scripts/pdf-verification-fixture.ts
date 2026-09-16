import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { defaultValues } from "../lib/defaultValues";
import { buildPacketPdf } from "../lib/pdfExport";
import type { AcceptedAssessment } from "../types/assessment";
import type { IntakePacket } from "../types/intake";

const outputPath = resolve(process.argv[2] ?? "assessment-final-verification.pdf");
const packet = JSON.parse(JSON.stringify(defaultValues)) as IntakePacket;
packet.identifying.participantName = "Fictitious PDF Preview Participant";
packet.identifying.dateOfBirth = "1955-04-12";
packet.identifying.dateOfIntake = "2026-09-15";
packet.identifying.evaluatorName = "Fictitious PDF Preview Clinician";
packet.psychosocial.currentStressors = "Transportation access limits attendance.";
packet.psychosocial.strengthsCoping = "Uses breathing exercises and family support.";
packet.safety.safetyPrecautions = "Supervision during community mobility.";
packet.goals.socialWorkServicesNeeded = "Transportation resource coordination needed.";

const repeatedNarrative = Array.from(
  { length: 34 },
  (_, index) =>
    `Review paragraph ${index + 1}. The participant's documented strengths, current barriers, functional support needs, and program goals were reviewed by the professional. This intentionally long fictitious paragraph verifies that accepted assessment text continues cleanly onto additional PDF pages without clipping or margin overflow.`
).join("\n\n");
const assessment: AcceptedAssessment = {
  assessmentText: `${repeatedNarrative}\n\nStrengths / Protective Factors\n- Uses breathing exercises and family support.\n\nIdentified Needs / Barriers\n- Transportation access limits attendance.\n\nSafety Considerations\n- Supervision during community mobility.\n\nRecommended Social-Work / Program Focus\n- Transportation resource coordination needed.`,
  clinicianEdited: true,
  generatedText: repeatedNarrative,
  localRevisionToken: "pdf-verification-fixture",
  validation: {
    criticalUnresolvedConflicts: 0,
    finalOutboundScan: "passed",
    outputPhiScan: "passed",
    preflightPhiScan: "passed",
    safetyPreserved: "passed",
    sourceFactsUsed: 4,
    sourceGrounding: "passed",
    unsupportedDiagnosisDetected: false
  }
};

async function main() {
  const bytes = await buildPacketPdf(packet, "final", assessment);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(outputPath);
}

void main();
