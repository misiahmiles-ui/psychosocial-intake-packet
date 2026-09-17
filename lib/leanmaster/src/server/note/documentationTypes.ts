// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
// Pure catalog/functions shared with local browser validation; no server I/O.

import {
  activitiesClinicalSafeguardInstruction,
  activitiesDisciplineDescription,
  activitiesDocumentationTypeIds,
  isActivitiesRoleAlias
} from "@/lib/leanmaster/src/server/note/activitiesServices";

export type OutputType = "dap" | "soap";

export type PrimaryNoteType = "progress_note" | "quarterly_progress_note";

export type DocumentationTypeId =
  | "dap_note"
  | "soap_note"
  | "dap_note_with_treatment_plan"
  | "soap_note_with_treatment_plan"
  | "general_progress_note"
  | "care_coordination_note"
  | "individualized_treatment_plan"
  | "quarterly_progress_note"
  | "quarterly_assessment"
  | "quarterly_psychosocial_assessment"
  | "program_administrative_note"
  | "activities_progress_note"
  | "individual_activity_note"
  | "group_activity_note"
  | "activities_assessment"
  | "activities_care_plan_contribution"
  | "quarterly_activities_progress_note"
  | "quarterly_activities_review"
  | "activities_evaluation"
  | "activities_participant_conference_note"
  | "activity_program_modification_note";

export type RoleDisciplineOption =
  | "CSW - Certified Social Worker"
  | "LSW - Licensed Social Worker"
  | "LSW - LCSW-Supervised Internally"
  | "LSW - LCSW-Supervised Externally"
  | "LCSW - Licensed Clinical Social Worker"
  | "Counselor"
  | "Therapist"
  | "Case Manager"
  | "Care Coordinator"
  | "Clinical Supervisor"
  | "Program Director"
  | "Assistant to Social Worker"
  | "Activities Services"
  | "Non-Clinical Support Staff"
  | "Nurse / RN"
  | "LPN"
  | "Administrator"
  | "Interdisciplinary Team Member"
  | "Other / Custom";

export type ClinicalLanguageLevel =
  | "clinical"
  | "supervised_clinical"
  | "psychosocial"
  | "nursing"
  | "activities"
  | "general"
  | "non_clinical";

export type DocumentationTypeRecord = {
  documentationTypeId: DocumentationTypeId;
  visibleLabel: string;
  description: string;
  workstream: string;
  sectionHeadings: string[];
  outputType: OutputType;
  primaryNoteType: PrimaryNoteType;
  exportTitle: string;
  clinicalLanguageLevel: ClinicalLanguageLevel;
  supportAnalysisEnabled: boolean;
  programNotice?: string;
};

export type RoleDocumentationRule = {
  roleId: string;
  visibleRoleName: RoleDisciplineOption;
  permittedDocumentationTypes: DocumentationTypeId[];
  recommendedDocumentationType: DocumentationTypeId;
  credentialLabel: string;
  clinicalLanguageLevel: ClinicalLanguageLevel;
  supervisionType: "" | "internal" | "external";
  prohibitedLanguage: string[];
  boundaryNotice: string;
};

export const roleDisciplineOptions: RoleDisciplineOption[] = [
  "CSW - Certified Social Worker",
  "LSW - Licensed Social Worker",
  "LSW - LCSW-Supervised Internally",
  "LSW - LCSW-Supervised Externally",
  "LCSW - Licensed Clinical Social Worker",
  "Counselor",
  "Therapist",
  "Case Manager",
  "Care Coordinator",
  "Clinical Supervisor",
  "Program Director",
  "Assistant to Social Worker",
  "Activities Services",
  "Non-Clinical Support Staff",
  "Nurse / RN",
  "LPN",
  "Administrator",
  "Interdisciplinary Team Member",
  "Other / Custom"
];

export const documentationTypeCatalog: Record<
  DocumentationTypeId,
  DocumentationTypeRecord
> = {
  dap_note: {
    documentationTypeId: "dap_note",
    visibleLabel: "Progress Note - DAP Format",
    description:
      "Clinical or psychosocial documentation organized as Data, Assessment, and Plan.",
    workstream: "Clinical / Psychosocial Documentation",
    sectionHeadings: ["Data", "Assessment", "Plan"],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "psychosocial",
    supportAnalysisEnabled: true
  },
  soap_note: {
    documentationTypeId: "soap_note",
    visibleLabel: "Progress Note - SOAP Format",
    description:
      "Clinical or nursing documentation organized as Subjective, Objective, Assessment, and Plan.",
    workstream: "Clinical / Nursing Documentation",
    sectionHeadings: ["Subjective", "Objective", "Assessment", "Plan"],
    outputType: "soap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "clinical",
    supportAnalysisEnabled: true
  },
  dap_note_with_treatment_plan: {
    documentationTypeId: "dap_note_with_treatment_plan",
    visibleLabel: "Progress Note - DAP Format / Treatment Plan",
    description:
      "Generates a DAP progress note first, then develops a concise individualized treatment plan from that completed progress note.",
    workstream: "Clinical / Psychosocial Documentation + Treatment Planning",
    sectionHeadings: [
      "Data",
      "Assessment",
      "Plan",
      "I. LONG-TERM GOAL",
      "II. SHORT-TERM OBJECTIVES",
      "III. INTERVENTIONS"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "psychosocial",
    supportAnalysisEnabled: true
  },
  soap_note_with_treatment_plan: {
    documentationTypeId: "soap_note_with_treatment_plan",
    visibleLabel: "Progress Note - SOAP Format / Treatment Plan",
    description:
      "Generates a SOAP progress note first, then develops a concise individualized treatment plan from that completed progress note.",
    workstream: "Clinical / Nursing Documentation + Treatment Planning",
    sectionHeadings: [
      "Subjective",
      "Objective",
      "Assessment",
      "Plan",
      "I. LONG-TERM GOAL",
      "II. SHORT-TERM OBJECTIVES",
      "III. INTERVENTIONS"
    ],
    outputType: "soap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "clinical",
    supportAnalysisEnabled: true
  },
  general_progress_note: {
    documentationTypeId: "general_progress_note",
    visibleLabel: "General Progress Note",
    description:
      "Factual documentation of the contact, information reported or observed, actions taken, member response, and follow-up.",
    workstream: "General Member Documentation",
    sectionHeadings: [
      "Reason for Contact",
      "Information Reported or Observed",
      "Actions Taken",
      "Member Response",
      "Follow-Up Plan"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "general",
    supportAnalysisEnabled: true
  },
  care_coordination_note: {
    documentationTypeId: "care_coordination_note",
    visibleLabel: "Care Coordination / Case Management Note",
    description:
      "Documentation of identified needs, referrals, coordination activities, barriers, resources, current status, and follow-up.",
    workstream: "Care Coordination / Case Management",
    sectionHeadings: [
      "Identified Need",
      "Coordination Activity",
      "Agency, Payer, Provider, or Resource",
      "Information or Referral Provided",
      "Barriers or Current Status",
      "Member Response",
      "Follow-Up Plan"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "CARE COORDINATION / CASE MANAGEMENT NOTE",
    clinicalLanguageLevel: "general",
    supportAnalysisEnabled: true
  },
  individualized_treatment_plan: {
    documentationTypeId: "individualized_treatment_plan",
    visibleLabel: "Treatment Plan",
    description:
      "A focused treatment plan generated from the de-identified Session Data / Program Context entered for the current treatment-planning session.",
    workstream: "Treatment Planning / Individualized Plan of Care",
    sectionHeadings: [
      "I. LONG-TERM GOAL",
      "II. SHORT-TERM OBJECTIVES",
      "III. INTERVENTIONS"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "TREATMENT PLAN",
    clinicalLanguageLevel: "clinical",
    supportAnalysisEnabled: false,
    programNotice:
      "Draft support only. Finalization, required participants, signatures, review frequency, and authorization depend on the selected role, setting, payer requirements, and organization policy."
  },
  quarterly_progress_note: {
    documentationTypeId: "quarterly_progress_note",
    visibleLabel: "Quarterly Progress Note",
    description:
      "Periodic program documentation completed according to facility policy, the staff member's role, and the available source information.",
    workstream: "Quarterly Documentation",
    sectionHeadings: ["Data", "Assessment", "Plan"],
    outputType: "dap",
    primaryNoteType: "quarterly_progress_note",
    exportTitle: "QUARTERLY PROGRESS NOTE",
    clinicalLanguageLevel: "psychosocial",
    supportAnalysisEnabled: true
  },
  quarterly_assessment: {
    documentationTypeId: "quarterly_assessment",
    visibleLabel: "Quarterly Assessment",
    description:
      "Quarterly assessment documentation using the available source information, role boundaries, and facility policy.",
    workstream: "Quarterly Assessment",
    sectionHeadings: [
      "Assessment Summary",
      "Current Functioning",
      "Barriers / Risks",
      "Recommendations / Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "quarterly_progress_note",
    exportTitle: "QUARTERLY ASSESSMENT",
    clinicalLanguageLevel: "psychosocial",
    supportAnalysisEnabled: true
  },
  quarterly_psychosocial_assessment: {
    documentationTypeId: "quarterly_psychosocial_assessment",
    visibleLabel: "Quarterly Psychosocial Assessment",
    description:
      "Quarterly psychosocial assessment documentation focused on de-identified psychosocial status, support needs, barriers, strengths, and follow-up.",
    workstream: "Quarterly Psychosocial Assessment",
    sectionHeadings: [
      "Psychosocial Summary",
      "Current Functioning",
      "Strengths and Barriers",
      "Recommendations / Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "quarterly_progress_note",
    exportTitle: "QUARTERLY PSYCHOSOCIAL ASSESSMENT",
    clinicalLanguageLevel: "psychosocial",
    supportAnalysisEnabled: true
  },
  program_administrative_note: {
    documentationTypeId: "program_administrative_note",
    visibleLabel: "Program / Administrative Note",
    description:
      "Factual documentation of appropriate program-related, operational, or administrative activity involving the member.",
    workstream: "Program / Administrative Documentation",
    sectionHeadings: [
      "Program or Administrative Concern",
      "Facts Reported or Observed",
      "Action Taken",
      "Staff or Department Notified",
      "Resolution or Current Status",
      "Required Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRAM / ADMINISTRATIVE NOTE",
    clinicalLanguageLevel: "non_clinical",
    supportAnalysisEnabled: true,
    programNotice:
      "Use this note in the member's official record only when permitted by facility policy. Incident reports, personnel matters, quality investigations, and other internal administrative records may require a separate reporting system."
  },
  activities_progress_note: {
    documentationTypeId: "activities_progress_note",
    visibleLabel: "Activities Progress Note",
    description:
      "Routine Activities Services documentation for adult day, adult medical day care, and adult day health programming.",
    workstream: "Activities Services Documentation",
    sectionHeadings: [
      "Activity or Service Provided",
      "Care-Plan Goal Addressed",
      "Participation and Response",
      "Assistance or Adaptations",
      "Outcome and Follow-Up",
      "Signature"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PROGRESS NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesDisciplineDescription
  },
  individual_activity_note: {
    documentationTypeId: "individual_activity_note",
    visibleLabel: "Individual Activity Note",
    description:
      "Individualized activity documentation focused on participant preference, goal addressed, assistance, observable response, outcome, and follow-up.",
    workstream: "Activities Services Documentation",
    sectionHeadings: [
      "Individualized Activity",
      "Participant Preference",
      "Goal Addressed",
      "Assistance Provided",
      "Observable Response",
      "Outcome / Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "INDIVIDUAL ACTIVITY NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  group_activity_note: {
    documentationTypeId: "group_activity_note",
    visibleLabel: "Group Activity Note",
    description:
      "Group activity documentation with individualized response when required and no copied identical responses across participants.",
    workstream: "Activities Services Documentation",
    sectionHeadings: [
      "Group Activity",
      "General Purpose",
      "Participants Included",
      "Individualized Response",
      "Staff Interventions",
      "Safety Concerns / Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "GROUP ACTIVITY NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  activities_assessment: {
    documentationTypeId: "activities_assessment",
    visibleLabel: "Activities Assessment",
    description:
      "Activities Services assessment documentation using participant interests, strengths, needs, barriers, preferences, adaptations, and IDT follow-up.",
    workstream: "Activities Services Assessment",
    sectionHeadings: [
      "Activities Assessment Summary",
      "Strengths / Interests / Preferences",
      "Activities Needs and Barriers",
      "Recommended Activities Supports",
      "IDT Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "ACTIVITIES ASSESSMENT",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice:
      "Activities assessments may be drafted or finalized only by staff with organization-authorized Activities Services permissions."
  },
  activities_care_plan_contribution: {
    documentationTypeId: "activities_care_plan_contribution",
    visibleLabel: "Activities Care Plan Contribution",
    description:
      "Activities Services contribution to the interdisciplinary care-plan workflow without changing other discipline-specific care-plan sections.",
    workstream: "Activities Services Care Plan",
    sectionHeadings: [
      "Participant Strengths and Interests",
      "Activities Needs and Barriers",
      "Measurable Activities Goals",
      "Planned Interventions and Frequency",
      "Responsible Discipline and Target Review Date",
      "Progress / IDT Review"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "ACTIVITIES CARE PLAN CONTRIBUTION",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice:
      "Activities Services staff may contribute to Activities care-plan content. Other discipline sections require explicit permission."
  },
  quarterly_activities_progress_note: {
    documentationTypeId: "quarterly_activities_progress_note",
    visibleLabel: "Quarterly Activities Progress Note",
    description:
      "Quarterly Activities Services progress documentation using objective participation, response, progress, barriers, adaptations, and IDT follow-up.",
    workstream: "Quarterly Activities Documentation",
    sectionHeadings: [
      "Quarterly Activities Summary",
      "Participation Patterns",
      "Progress Toward Activities Goals",
      "Barriers and Adaptations",
      "Care Plan Updates / IDT Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "quarterly_progress_note",
    exportTitle: "QUARTERLY PROGRESS NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  quarterly_activities_review: {
    documentationTypeId: "quarterly_activities_review",
    visibleLabel: "Quarterly Activities Review",
    description:
      "Quarterly review of Activities Services engagement, goals, adaptations, barriers, and interdisciplinary follow-up.",
    workstream: "Quarterly Activities Documentation",
    sectionHeadings: [
      "Quarterly Activities Summary",
      "Participation Patterns",
      "Progress Toward Activities Goals",
      "Barriers and Adaptations",
      "Care Plan Updates / IDT Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "quarterly_progress_note",
    exportTitle: "QUARTERLY ACTIVITIES REVIEW",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  activities_evaluation: {
    documentationTypeId: "activities_evaluation",
    visibleLabel: "Activities Evaluation",
    description:
      "Activities Services evaluation focused on activity response, strengths, needs, barriers, adaptations, program modification, and IDT follow-up.",
    workstream: "Activities Services Evaluation",
    sectionHeadings: [
      "Evaluation Summary",
      "Observed Participation / Response",
      "Strengths and Preferences",
      "Barriers / Adaptations",
      "Recommendations / Follow-Up"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "ACTIVITIES EVALUATION",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  activities_participant_conference_note: {
    documentationTypeId: "activities_participant_conference_note",
    visibleLabel: "Participant Conference Note",
    description:
      "Activities Services conference documentation covering participant input, preferences, program feedback, staff response, and follow-up.",
    workstream: "Activities Services Participant Conference",
    sectionHeadings: [
      "Conference Purpose",
      "Participant Input / Preferences",
      "Activities Feedback",
      "Staff Response",
      "Follow-Up / IDT Communication"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "PARTICIPANT CONFERENCE NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  },
  activity_program_modification_note: {
    documentationTypeId: "activity_program_modification_note",
    visibleLabel: "Activity Program Modification Note",
    description:
      "Activities program modification documentation for changes to activity plan, adaptations, participant preference, barriers, and follow-up.",
    workstream: "Activities Services Program Modification",
    sectionHeadings: [
      "Program Modification Need",
      "Reason / Source Information",
      "Adaptation or Change Made",
      "Participant Response / Preference",
      "Follow-Up / Review Plan"
    ],
    outputType: "dap",
    primaryNoteType: "progress_note",
    exportTitle: "ACTIVITY PROGRAM MODIFICATION NOTE",
    clinicalLanguageLevel: "activities",
    supportAnalysisEnabled: true,
    programNotice: activitiesClinicalSafeguardInstruction
  }
};

export const documentTitleMap: Record<DocumentationTypeId, string> = {
  dap_note: "PROGRESS NOTE",
  soap_note: "PROGRESS NOTE",
  dap_note_with_treatment_plan: "PROGRESS NOTE",
  soap_note_with_treatment_plan: "PROGRESS NOTE",
  general_progress_note: "PROGRESS NOTE",
  care_coordination_note: "CARE COORDINATION / CASE MANAGEMENT NOTE",
  individualized_treatment_plan: "TREATMENT PLAN",
  quarterly_progress_note: "QUARTERLY PROGRESS NOTE",
  quarterly_assessment: "QUARTERLY ASSESSMENT",
  quarterly_psychosocial_assessment: "QUARTERLY PSYCHOSOCIAL ASSESSMENT",
  program_administrative_note: "PROGRAM / ADMINISTRATIVE NOTE",
  activities_progress_note: "PROGRESS NOTE",
  individual_activity_note: "INDIVIDUAL ACTIVITY NOTE",
  group_activity_note: "GROUP ACTIVITY NOTE",
  activities_assessment: "ACTIVITIES ASSESSMENT",
  activities_care_plan_contribution: "ACTIVITIES CARE PLAN CONTRIBUTION",
  quarterly_activities_progress_note: "QUARTERLY PROGRESS NOTE",
  quarterly_activities_review: "QUARTERLY ACTIVITIES REVIEW",
  activities_evaluation: "ACTIVITIES EVALUATION",
  activities_participant_conference_note: "PARTICIPANT CONFERENCE NOTE",
  activity_program_modification_note: "ACTIVITY PROGRAM MODIFICATION NOTE"
};

export function documentTitleForDocumentationTypeId(
  documentationTypeId: DocumentationTypeId
) {
  return documentTitleMap[documentationTypeId];
}

export function documentationFormatForDocumentationTypeId(
  documentationTypeId: DocumentationTypeId
) {
  return documentationTypeCatalog[documentationTypeId].outputType.toUpperCase();
}

export function shouldShowDocumentationFormatForDocumentationTypeId(
  documentationTypeId: DocumentationTypeId
) {
  return [
    "dap_note",
    "soap_note",
    "dap_note_with_treatment_plan",
    "soap_note_with_treatment_plan",
    "quarterly_progress_note"
  ].includes(
    documentationTypeId
  );
}

const allDocumentationTypes: DocumentationTypeId[] = [
  "dap_note",
  "soap_note",
  "dap_note_with_treatment_plan",
  "soap_note_with_treatment_plan",
  "general_progress_note",
  "care_coordination_note",
  "individualized_treatment_plan",
  "quarterly_progress_note",
  "quarterly_assessment",
  "quarterly_psychosocial_assessment",
  "program_administrative_note",
  ...activitiesDocumentationTypeIds
];

const clinicalWithoutProgram: DocumentationTypeId[] = [
  "dap_note",
  "soap_note",
  "dap_note_with_treatment_plan",
  "soap_note_with_treatment_plan",
  "general_progress_note",
  "care_coordination_note",
  "individualized_treatment_plan",
  "quarterly_progress_note",
  "quarterly_assessment",
  "quarterly_psychosocial_assessment"
];

const generalCareQuarterlyProgram: DocumentationTypeId[] = [
  "general_progress_note",
  "care_coordination_note",
  "quarterly_progress_note",
  "quarterly_assessment",
  "quarterly_psychosocial_assessment",
  "program_administrative_note"
];

const generalCareProgram: DocumentationTypeId[] = [
  "general_progress_note",
  "care_coordination_note",
  "program_administrative_note"
];

const activitiesDocumentationTypes: DocumentationTypeId[] = [
  ...activitiesDocumentationTypeIds
];

function roleRule(
  roleId: string,
  visibleRoleName: RoleDisciplineOption,
  permittedDocumentationTypes: DocumentationTypeId[],
  recommendedDocumentationType: DocumentationTypeId,
  credentialLabel: string,
  clinicalLanguageLevel: ClinicalLanguageLevel,
  boundaryNotice: string,
  prohibitedLanguage: string[] = [],
  supervisionType: RoleDocumentationRule["supervisionType"] = ""
): RoleDocumentationRule {
  return {
    roleId,
    visibleRoleName,
    permittedDocumentationTypes,
    recommendedDocumentationType,
    credentialLabel,
    clinicalLanguageLevel,
    supervisionType,
    prohibitedLanguage,
    boundaryNotice
  };
}

export const roleDocumentationTypeMap: Record<
  RoleDisciplineOption,
  RoleDocumentationRule
> = {
  "LCSW - Licensed Clinical Social Worker": roleRule(
    "lcsw",
    "LCSW - Licensed Clinical Social Worker",
    allDocumentationTypes,
    "dap_note",
    "LCSW",
    "clinical",
    "Clinical terminology may be used only when supported by the entered information and appropriate to the documented service."
  ),
  "LSW - LCSW-Supervised Internally": roleRule(
    "lsw_supervised_internal",
    "LSW - LCSW-Supervised Internally",
    clinicalWithoutProgram,
    "dap_note",
    "LSW",
    "supervised_clinical",
    "Do not imply independent psychotherapy practice. Frame applicable clinical language within internal LCSW supervision.",
    ["independent psychotherapy", "independent diagnosis"],
    "internal"
  ),
  "LSW - LCSW-Supervised Externally": roleRule(
    "lsw_supervised_external",
    "LSW - LCSW-Supervised Externally",
    clinicalWithoutProgram,
    "dap_note",
    "LSW",
    "supervised_clinical",
    "Do not imply independent psychotherapy practice. Frame applicable clinical language within external LCSW supervision.",
    ["independent psychotherapy", "independent diagnosis"],
    "external"
  ),
  "LSW - Licensed Social Worker": roleRule(
    "lsw",
    "LSW - Licensed Social Worker",
    clinicalWithoutProgram,
    "dap_note",
    "LSW",
    "psychosocial",
    "Use psychosocial support, social work support, advocacy, care coordination, resource linkage, member education, and interdisciplinary collaboration. Do not imply independent psychotherapy or unsupported medical necessity.",
    ["independent psychotherapy", "independent diagnosis", "medical necessity"]
  ),
  "CSW - Certified Social Worker": roleRule(
    "csw",
    "CSW - Certified Social Worker",
    ["general_progress_note", "care_coordination_note", "quarterly_progress_note"],
    "general_progress_note",
    "CSW",
    "general",
    "Use non-independent and non-psychotherapy social work language. DAP and SOAP are not shown by default.",
    ["psychotherapy", "independent clinical assessment", "independent diagnosis"]
  ),
  Counselor: roleRule(
    "counselor",
    "Counselor",
    clinicalWithoutProgram,
    "dap_note",
    "Counselor",
    "clinical",
    "Do not invent a license, credential, or supervision status."
  ),
  Therapist: roleRule(
    "therapist",
    "Therapist",
    clinicalWithoutProgram,
    "dap_note",
    "Therapist",
    "clinical",
    "Do not infer a specific license from the title alone."
  ),
  "Nurse / RN": roleRule(
    "nurse_rn",
    "Nurse / RN",
    [
      "soap_note",
      "soap_note_with_treatment_plan",
      "general_progress_note",
      "care_coordination_note",
      "individualized_treatment_plan",
      "quarterly_progress_note"
    ],
    "soap_note",
    "RN",
    "nursing",
    "Use nursing-appropriate terminology. Do not generate psychotherapy language unless a separately verified role and source documentation support it.",
    ["psychotherapy", "independent psychotherapy"]
  ),
  LPN: roleRule(
    "lpn",
    "LPN",
    [
      "general_progress_note",
      "care_coordination_note",
      "individualized_treatment_plan",
      "soap_note",
      "soap_note_with_treatment_plan",
      "quarterly_progress_note"
    ],
    "general_progress_note",
    "LPN",
    "nursing",
    "Do not imply independent diagnosis or authority beyond the selected role.",
    ["independent diagnosis", "independent clinical authority"]
  ),
  "Case Manager": roleRule(
    "case_manager",
    "Case Manager",
    ["general_progress_note", "care_coordination_note", "quarterly_progress_note"],
    "care_coordination_note",
    "Case Manager",
    "general",
    "Use care coordination and case management language. DAP and SOAP are not shown by default.",
    ["psychotherapy", "clinical assessment", "independent diagnosis"]
  ),
  "Care Coordinator": roleRule(
    "care_coordinator",
    "Care Coordinator",
    ["general_progress_note", "care_coordination_note", "quarterly_progress_note"],
    "care_coordination_note",
    "Care Coordinator",
    "general",
    "Use care coordination language. DAP and SOAP are not shown by default.",
    ["psychotherapy", "clinical assessment", "independent diagnosis"]
  ),
  "Program Director": roleRule(
    "program_director",
    "Program Director",
    generalCareQuarterlyProgram,
    "general_progress_note",
    "Program Director",
    "general",
    "Do not infer clinical licensure from Program Director.",
    ["psychotherapy", "independent diagnosis", "clinical licensure"]
  ),
  Administrator: roleRule(
    "administrator",
    "Administrator",
    generalCareQuarterlyProgram,
    "general_progress_note",
    "Administrator",
    "general",
    "Do not infer clinical authority from Administrator.",
    ["psychotherapy", "independent diagnosis", "clinical authority"]
  ),
  "Assistant to Social Worker": roleRule(
    "assistant_to_social_worker",
    "Assistant to Social Worker",
    generalCareQuarterlyProgram,
    "general_progress_note",
    "Assistant to Social Worker",
    "general",
    "Do not represent that the assistant independently completed a clinical assessment.",
    ["clinical assessment", "psychotherapy", "independent diagnosis"]
  ),
  "Activities Services": roleRule(
    "activities_services",
    "Activities Services",
    activitiesDocumentationTypes,
    "activities_progress_note",
    "Activities Services",
    "activities",
    "Use objective Activities Services language: activity/service provided, care-plan goal addressed, participation and response, assistance or adaptations, outcome, follow-up, and signature. Do not imply licensure, certification, independent clinical diagnosis, psychotherapy, medical necessity, eligibility determination, or care-plan finalization authority unless separately verified and authorized.",
    [
      "psychiatric diagnosis",
      "medical diagnosis",
      "mental status conclusion",
      "suicide risk conclusion",
      "homicide risk conclusion",
      "psychosis conclusion",
      "medical necessity",
      "insurance approval",
      "eligibility determination"
    ]
  ),
  "Non-Clinical Support Staff": roleRule(
    "non_clinical_support_staff",
    "Non-Clinical Support Staff",
    generalCareProgram,
    "general_progress_note",
    "Non-Clinical Support Staff",
    "non_clinical",
    "Do not generate clinical assessment, diagnosis, psychotherapy, medical necessity, risk conclusions, or treatment interpretation.",
    ["clinical assessment", "diagnosis", "psychotherapy", "medical necessity"]
  ),
  "Interdisciplinary Team Member": roleRule(
    "idt_member",
    "Interdisciplinary Team Member",
    generalCareQuarterlyProgram,
    "general_progress_note",
    "Interdisciplinary Team Member",
    "general",
    "DAP and SOAP are not shown unless an authorized clinical discipline is captured separately.",
    ["psychotherapy", "independent diagnosis"]
  ),
  "Clinical Supervisor": roleRule(
    "clinical_supervisor",
    "Clinical Supervisor",
    generalCareQuarterlyProgram,
    "general_progress_note",
    "Clinical Supervisor",
    "general",
    "Do not infer a license solely from Clinical Supervisor. Use the supervisor credential only when separately verified.",
    ["unverified licensure", "independent diagnosis"]
  ),
  "Other / Custom": roleRule(
    "other_custom",
    "Other / Custom",
    generalCareProgram,
    "general_progress_note",
    "Other / Custom",
    "general",
    "General, care coordination, and program documentation are available until an authorized clinical discipline is verified.",
    ["unverified clinical credential", "psychotherapy", "independent diagnosis"]
  )
};

export const documentationTypeOptions = Object.values(documentationTypeCatalog);

export function coerceDocumentationTypeId(
  value: unknown
): DocumentationTypeId | null {
  return typeof value === "string" && value in documentationTypeCatalog
    ? (value as DocumentationTypeId)
    : null;
}

export function coerceRoleDiscipline(value: unknown): RoleDisciplineOption {
  if (isActivitiesRoleAlias(value)) {
    return "Activities Services";
  }

  return typeof value === "string" &&
    roleDisciplineOptions.includes(value as RoleDisciplineOption)
    ? (value as RoleDisciplineOption)
    : "Other / Custom";
}

export function getRoleDocumentationRule(roleDiscipline: string) {
  return roleDocumentationTypeMap[coerceRoleDiscipline(roleDiscipline)];
}

export function getPermittedDocumentationTypesForRole(roleDiscipline: string) {
  const rule = getRoleDocumentationRule(roleDiscipline);
  return rule.permittedDocumentationTypes.map((id) => documentationTypeCatalog[id]);
}

export function getRecommendedDocumentationTypeForRole(roleDiscipline: string) {
  const rule = getRoleDocumentationRule(roleDiscipline);
  return rule.recommendedDocumentationType;
}

export function isDocumentationTypePermittedForRole(
  roleDiscipline: string,
  documentationTypeId: DocumentationTypeId
) {
  return getRoleDocumentationRule(roleDiscipline).permittedDocumentationTypes.includes(
    documentationTypeId
  );
}

export function legacyDocumentationTypeToCanonical(options: {
  legacyValue?: unknown;
  outputType?: unknown;
  primaryNoteType?: unknown;
}): DocumentationTypeId {
  const outputType = options.outputType === "soap" ? "soap" : "dap";
  const primaryNoteType =
    options.primaryNoteType === "quarterly_progress_note"
      ? "quarterly_progress_note"
      : "progress_note";
  const raw =
    typeof options.legacyValue === "string"
      ? options.legacyValue.trim().toLowerCase()
      : "";

  if (raw.includes("quarterly")) {
    if (raw.includes("psychosocial") && raw.includes("assessment")) {
      return "quarterly_psychosocial_assessment";
    }

    if (raw.includes("assessment")) {
      return "quarterly_assessment";
    }

    return "quarterly_progress_note";
  }

  if (primaryNoteType === "quarterly_progress_note") {
    return "quarterly_progress_note";
  }

  if (
    raw === "individual therapy/session documentation" ||
    raw === "lcsw clinical psychotherapy note"
  ) {
    return outputType === "soap" ? "soap_note" : "dap_note";
  }

  if (raw === "lsw individual support session") {
    return outputType === "soap" ? "soap_note" : "general_progress_note";
  }

  if (raw === "case management follow-up" || raw === "care coordination summary") {
    return "care_coordination_note";
  }

  if (
    raw === "clinical supervisor review" ||
    raw === "program / administrative note"
  ) {
    return "program_administrative_note";
  }

  if (raw === "dap" || raw === "dap note") {
    return "dap_note";
  }

  if (raw === "soap" || raw === "soap note") {
    return "soap_note";
  }

  return outputType === "soap" ? "soap_note" : "general_progress_note";
}

export function resolveDocumentationTypeForRole(options: {
  roleDiscipline: string;
  documentationTypeId?: unknown;
  outputType?: unknown;
  primaryNoteType?: unknown;
  legacyWorkstreamDocumentationType?: unknown;
  explicitSelection?: boolean;
}) {
  const rule = getRoleDocumentationRule(options.roleDiscipline);
  const explicitId = coerceDocumentationTypeId(options.documentationTypeId);
  const candidate =
    explicitId ||
    legacyDocumentationTypeToCanonical({
      legacyValue: options.legacyWorkstreamDocumentationType,
      outputType: options.outputType,
      primaryNoteType: options.primaryNoteType
    });

  if (rule.permittedDocumentationTypes.includes(candidate)) {
    return {
      documentationTypeId: candidate,
      normalizedFromLegacy: !explicitId,
      compatibilityNotice: ""
    };
  }

  const fallback =
    rule.permittedDocumentationTypes.includes("general_progress_note")
      ? "general_progress_note"
      : rule.recommendedDocumentationType;

  return {
    documentationTypeId: fallback,
    normalizedFromLegacy: !explicitId,
    compatibilityNotice:
      `The selected role does not use this documentation format by default. ${documentationTypeCatalog[fallback].visibleLabel} has been selected as the role-appropriate format.`,
    validationError:
      explicitId || options.explicitSelection
        ? `The selected role does not permit ${documentationTypeCatalog[candidate].visibleLabel}. Select a role-appropriate documentation type.`
        : ""
  };
}
