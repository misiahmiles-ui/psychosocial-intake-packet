import type {
  IntakePacket,
  IntakeStep,
  PsychosocialJurisdiction
} from "@/types/intake";
import { INTAKE_STEPS } from "./sections";

export const JURISDICTION_LABELS: Record<PsychosocialJurisdiction, string> = {
  NJ: "New Jersey Psychosocial Edition",
  MD: "Maryland Psychosocial Edition"
};

const statusOptions = [
  { label: "Not started", value: "Not started" },
  { label: "Requested", value: "Requested" },
  { label: "Received / completed", value: "Received / completed" },
  { label: "Not applicable", value: "Not applicable" }
];

const marylandAdmissionStep: IntakeStep = {
  id: "maryland-admission",
  title: "Maryland Admission Documents and Coordination",
  shortTitle: "MD Admission",
  eyebrow: "Maryland Addendum",
  description:
    "Maryland Adult Medical Day Care psychosocial tracking for rights, consent, home-environment, referral, and multidisciplinary coordination. This addendum does not replace official Maryland forms or agency review.",
  groups: [
    {
      title: "Admission Document Checklist",
      description:
        "Track receipt or completion only. Keep official documents in the agency record according to agency policy; this app does not upload or store them.",
      fields: [
        {
          path: "maryland.admissionDocuments",
          label: "Maryland admission documents tracked",
          kind: "checkboxGroup",
          full: true,
          options: [
            { label: "Preadmission health assessment dated within 45 days before admission", value: "Preadmission health assessment dated within 45 days before admission" },
            { label: "Written service contract", value: "Written service contract" },
            { label: "Participant rights information", value: "Participant rights information" },
            { label: "Required treatment, transportation, activity, photograph, and information-release consents", value: "Required treatment, transportation, activity, photograph, and information-release consents" },
            { label: "Home-environment assessment", value: "Home-environment assessment" },
            { label: "Psychosocial and social-history contribution", value: "Psychosocial and social-history contribution" },
            { label: "Referral and care-coordination records", value: "Referral and care-coordination records" },
            { label: "Multidisciplinary planning participation record", value: "Multidisciplinary planning participation record" }
          ]
        },
        {
          path: "maryland.officialForms",
          label: "Official Maryland forms completed or maintained externally",
          kind: "checkboxGroup",
          full: true,
          options: [
            { label: "Maryland Medical Day Care Freedom of Choice form", value: "Maryland Medical Day Care Freedom of Choice form" },
            { label: "Maryland Participant Rights and Responsibilities form", value: "Maryland Participant Rights and Responsibilities form" },
            { label: "Maryland participant health-related assessment / required provider form", value: "Maryland participant health-related assessment / required provider form" },
            { label: "Official service plan / plan-of-care record", value: "Official service plan / plan-of-care record" },
            { label: "Official signature record", value: "Official signature record" }
          ]
        }
      ]
    },
    {
      title: "Maryland Timing and Rights Tracking",
      fields: [
        { path: "maryland.preadmissionAssessmentStatus", label: "Preadmission assessment status", kind: "select", options: statusOptions },
        { path: "maryland.preadmissionAssessmentDate", label: "Preadmission assessment date", kind: "date" },
        { path: "maryland.serviceContractStatus", label: "Written service contract status", kind: "select", options: statusOptions },
        { path: "maryland.participantRightsStatus", label: "Participant rights information status", kind: "select", options: statusOptions },
        { path: "maryland.participantRightsLanguage", label: "Language / communication method used for rights information" },
        { path: "maryland.homeEnvironmentAssessmentStatus", label: "Home-environment assessment status", kind: "select", options: statusOptions },
        { path: "maryland.homeEnvironmentAssessmentDate", label: "Home-environment assessment date", kind: "date" }
      ]
    },
    {
      title: "Maryland Social Work and Multidisciplinary Coordination",
      description:
        "Document the social worker's contribution to goals, referrals, and multidisciplinary planning within credentials and agency policy.",
      fields: [
        { path: "maryland.socialWorkConsultationStatus", label: "Social-work consultation status", kind: "select", options: statusOptions },
        { path: "maryland.socialWorkConsultationDate", label: "Social-work consultation date", kind: "date" },
        {
          path: "maryland.socialWorkerCredential",
          label: "Maryland social-work credential",
          kind: "select",
          options: [
            { label: "LBSW", value: "LBSW" },
            { label: "LMSW", value: "LMSW" },
            { label: "LCSW", value: "LCSW" },
            { label: "LCSW-C", value: "LCSW-C" }
          ]
        },
        { path: "maryland.socialWorkerLicenseNumber", label: "Maryland social-work license number" },
        { path: "maryland.significantChangeDate", label: "Significant change date, if applicable", kind: "date" },
        { path: "maryland.significantChangeReassessmentStatus", label: "Next-attendance-day reassessment tracking status", kind: "select", options: statusOptions },
        { path: "maryland.planOfCareCoordinationStatus", label: "Plan-of-care coordination status", kind: "select", options: statusOptions },
        { path: "maryland.planOfCareCompletionDate", label: "Initial plan-of-care completion date (within 30 days of admission)", kind: "date" },
        { path: "maryland.planOfCareNextReviewDate", label: "Next plan-of-care review due (at least semiannually)", kind: "date" },
        { path: "maryland.planOfCareStatusChangeDate", label: "Status-change date requiring plan update, if applicable", kind: "date" },
        { path: "maryland.planOfCareUpdateDate", label: "Plan-of-care update date (within 7 calendar days of status change)", kind: "date" },
        { path: "maryland.multidisciplinaryMeetingDate", label: "Multidisciplinary planning meeting date", kind: "date" },
        { path: "maryland.psychosocialContribution", label: "Psychosocial contribution to goals, referrals, and planning", kind: "textarea", full: true }
      ]
    },
    {
      title: "Maryland Discharge Documentation",
      description:
        "Track Maryland's advance written-notice requirement and any documented regulatory exception. Agency review is required before relying on an exception.",
      fields: [
        { path: "maryland.dischargeNoticeDate", label: "Advance written discharge notice date", kind: "date" },
        { path: "maryland.dischargeException", label: "Emergency / regulatory exception, if applicable", kind: "textarea", full: true },
        { path: "maryland.dischargeReason", label: "Discharge reason and planned location", kind: "textarea", full: true },
        { path: "maryland.notes", label: "Maryland edition notes", kind: "textarea", full: true }
      ]
    }
  ]
};

export function resolvePsychosocialJurisdiction(
  packet: Pick<IntakePacket, "jurisdiction"> | null | undefined
): PsychosocialJurisdiction {
  return packet?.jurisdiction === "MD" ? "MD" : "NJ";
}

export function getIntakeSteps(
  jurisdiction: PsychosocialJurisdiction
): IntakeStep[] {
  if (jurisdiction === "NJ") {
    return INTAKE_STEPS;
  }

  const steps = INTAKE_STEPS.map((step) => {
    if (step.id === "identifying") {
      return {
        ...step,
        description:
          "Basic participant and evaluator details for the Maryland Adult Medical Day Care psychosocial record.",
        fields: step.fields?.map((field) =>
          field.path === "identifying.evaluatorDiscipline"
            ? {
                ...field,
                label: "Evaluator discipline / Maryland credential",
                helpText:
                  "For social-work services, use the Maryland credential held by the evaluator (LBSW, LMSW, LCSW, or LCSW-C)."
              }
            : field
        )
      };
    }

    if (step.id === "mental-status") {
      return {
        ...step,
        description:
          "Adapted Kahn-style orientation and memory screen with an automatic error-count summary. This is a screening aid, not a diagnosis, capacity determination, Maryland program-eligibility determination, or substitute for required clinical assessment."
      };
    }

    if (step.id === "initial-discharge") {
      return {
        ...step,
        description:
          "Initial social-services assessment and projected discharge-planning contribution for Maryland Adult Medical Day Care. The agency remains responsible for required notice, team review, and final discharge documentation."
      };
    }

    return step;
  });

  return [...steps, marylandAdmissionStep];
}
