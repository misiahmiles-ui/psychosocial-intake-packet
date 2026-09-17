// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
// Pure catalog/functions shared with local browser validation; no server I/O.

export const activitiesDisciplineValue = "activities_services" as const;
export const activitiesDisciplineLabel = "Activities Services";
export const activitiesDisciplineDescription =
  "Staff responsible for planning, providing, documenting, coordinating, and evaluating participant activities and recreational programming.";

export type ActivitiesJobTitleValue =
  | "activities_director"
  | "assistant_activities_director"
  | "activities_director_assistant"
  | "activities_coordinator"
  | "activities_assistant"
  | "activities_staff_member"
  | "therapeutic_recreation_specialist"
  | "other_activities_staff";

export type ActivitiesCredentialValue =
  | "adc"
  | "ctrs"
  | "other_activities_credential"
  | "no_credential_entered";

export type ActivitiesParticipationValue =
  | "independently_participated"
  | "minimal_prompting"
  | "moderate_prompting"
  | "extensive_assistance"
  | "observed_only"
  | "partially_participated"
  | "declined"
  | "unable_to_participate"
  | "left_activity_early"
  | "activity_not_offered"
  | "other";

export type ActivitiesCategoryValue =
  | "social"
  | "physical"
  | "cognitive"
  | "recreational"
  | "educational"
  | "creative_arts"
  | "music"
  | "spiritual"
  | "psychological_wellness"
  | "discussion_group"
  | "exercise_group"
  | "participant_council"
  | "special_event"
  | "community_outing"
  | "community_service"
  | "individualized_activity"
  | "other";

export type ActivitiesPermission =
  | "create_activities_progress_notes"
  | "finalize_activities_progress_notes"
  | "create_activities_assessments"
  | "finalize_activities_assessments"
  | "create_activities_evaluations"
  | "finalize_activities_evaluations"
  | "complete_activities_care_plan_contributions"
  | "complete_quarterly_activities_progress_notes"
  | "complete_quarterly_activities_reviews"
  | "document_participant_conferences"
  | "review_subordinate_activities_notes"
  | "cosign_subordinate_notes"
  | "sign_activities_care_plan_portion_when_authorized"
  | "modify_activity_program_documentation"
  | "access_activities_quality_review_reports"
  | "create_individual_activity_notes"
  | "create_group_activity_notes"
  | "draft_activities_assessments"
  | "draft_activities_care_plan_contributions"
  | "review_staff_notes_when_assigned"
  | "document_participation_and_response"
  | "document_prompting_and_adaptations"
  | "document_preferences_and_barriers"
  | "submit_care_plan_observations";

export const activitiesJobTitleOptions: {
  value: ActivitiesJobTitleValue;
  label: string;
  standardized?: boolean;
}[] = [
  {
    value: "activities_director",
    label: "Activities Director"
  },
  {
    value: "assistant_activities_director",
    label: "Assistant Activities Director",
    standardized: true
  },
  {
    value: "activities_director_assistant",
    label: "Activities Director Assistant"
  },
  {
    value: "activities_coordinator",
    label: "Activities Coordinator"
  },
  {
    value: "activities_assistant",
    label: "Activities Assistant"
  },
  {
    value: "activities_staff_member",
    label: "Activities Staff Member"
  },
  {
    value: "therapeutic_recreation_specialist",
    label: "Therapeutic Recreation Specialist"
  },
  {
    value: "other_activities_staff",
    label: "Other Activities Services Staff"
  }
];

export const activitiesCredentialOptions: {
  value: ActivitiesCredentialValue;
  label: string;
}[] = [
  { value: "adc", label: "ADC - Activity Director Certified" },
  { value: "ctrs", label: "CTRS - Certified Therapeutic Recreation Specialist" },
  { value: "other_activities_credential", label: "Other Activities Credential" },
  { value: "no_credential_entered", label: "No Credential Entered" }
];

export const activitiesParticipationOptions: {
  value: ActivitiesParticipationValue;
  label: string;
}[] = [
  { value: "independently_participated", label: "Independently Participated" },
  { value: "minimal_prompting", label: "Participated With Minimal Prompting" },
  { value: "moderate_prompting", label: "Participated With Moderate Prompting" },
  { value: "extensive_assistance", label: "Participated With Extensive Assistance" },
  { value: "observed_only", label: "Observed Only" },
  { value: "partially_participated", label: "Partially Participated" },
  { value: "declined", label: "Declined" },
  { value: "unable_to_participate", label: "Unable to Participate" },
  { value: "left_activity_early", label: "Left Activity Early" },
  { value: "activity_not_offered", label: "Activity Not Offered" },
  { value: "other", label: "Other" }
];

export const activitiesCategoryOptions: {
  value: ActivitiesCategoryValue;
  label: string;
}[] = [
  { value: "social", label: "Social" },
  { value: "physical", label: "Physical" },
  { value: "cognitive", label: "Cognitive" },
  { value: "recreational", label: "Recreational" },
  { value: "educational", label: "Educational" },
  { value: "creative_arts", label: "Creative Arts" },
  { value: "music", label: "Music" },
  { value: "spiritual", label: "Spiritual" },
  { value: "psychological_wellness", label: "Psychological Wellness" },
  { value: "discussion_group", label: "Discussion Group" },
  { value: "exercise_group", label: "Exercise Group" },
  { value: "participant_council", label: "Participant Council" },
  { value: "special_event", label: "Special Event" },
  { value: "community_outing", label: "Community Outing" },
  { value: "community_service", label: "Community Service" },
  { value: "individualized_activity", label: "Individualized Activity" },
  { value: "other", label: "Other" }
];

export const activitiesRoleAliases = [
  "Activities Services",
  "activities_services",
  "Activities Staff",
  "Activities Director",
  "Assistant Activities Director",
  "Activities Director Assistant",
  "Activities Coordinator",
  "Activities Assistant",
  "Activities Staff Member",
  "Recreational Staff",
  "Therapeutic Recreation",
  "Therapeutic Recreation Specialist"
];

export const activitiesDocumentationTypeIds = [
  "activities_progress_note",
  "individual_activity_note",
  "group_activity_note",
  "activities_assessment",
  "activities_care_plan_contribution",
  "quarterly_activities_progress_note",
  "quarterly_activities_review",
  "activities_evaluation",
  "activities_participant_conference_note",
  "activity_program_modification_note"
] as const;

export function isActivitiesRoleAlias(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  return activitiesRoleAliases.some(
    (alias) => alias.trim().toLowerCase().replace(/[_-]+/g, " ") === normalized
  );
}

export function labelForActivitiesJobTitle(value?: string) {
  return (
    activitiesJobTitleOptions.find((option) => option.value === value)?.label ||
    ""
  );
}

export function labelForActivitiesCredential(value?: string) {
  const label =
    activitiesCredentialOptions.find((option) => option.value === value)?.label ||
    "";

  return label === "No Credential Entered" ? "" : label;
}

export function labelForActivitiesParticipation(value?: string) {
  return (
    activitiesParticipationOptions.find((option) => option.value === value)
      ?.label || ""
  );
}

export function labelsForActivitiesCategories(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  const allowed = new Map(
    activitiesCategoryOptions.map((option) => [option.value, option.label])
  );
  return values
    .filter((value): value is ActivitiesCategoryValue =>
      typeof value === "string" && allowed.has(value as ActivitiesCategoryValue)
    )
    .map((value) => allowed.get(value) || value);
}

export const activitiesPermissionMatrix: Record<
  ActivitiesJobTitleValue,
  {
    label: string;
    defaultPermissions: ActivitiesPermission[];
    restrictedByDefault: string[];
  }
> = {
  activities_director: {
    label: "Activities Director",
    defaultPermissions: [
      "create_activities_progress_notes",
      "finalize_activities_progress_notes",
      "create_activities_assessments",
      "finalize_activities_assessments",
      "create_activities_evaluations",
      "finalize_activities_evaluations",
      "complete_activities_care_plan_contributions",
      "complete_quarterly_activities_progress_notes",
      "complete_quarterly_activities_reviews",
      "document_participant_conferences",
      "review_subordinate_activities_notes",
      "cosign_subordinate_notes",
      "sign_activities_care_plan_portion_when_authorized",
      "modify_activity_program_documentation",
      "access_activities_quality_review_reports"
    ],
    restrictedByDefault: []
  },
  assistant_activities_director: {
    label: "Assistant Activities Director",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "draft_activities_assessments",
      "draft_activities_care_plan_contributions",
      "complete_quarterly_activities_progress_notes",
      "review_staff_notes_when_assigned"
    ],
    restrictedByDefault: [
      "Finalize or co-sign restricted assessments or care plans only when granted by an authorized organization administrator."
    ]
  },
  activities_director_assistant: {
    label: "Activities Director Assistant",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "draft_activities_assessments",
      "draft_activities_care_plan_contributions",
      "document_participation_and_response",
      "document_prompting_and_adaptations"
    ],
    restrictedByDefault: [
      "Cannot finalize restricted assessments or care plans unless separately authorized."
    ]
  },
  activities_coordinator: {
    label: "Activities Coordinator",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "draft_activities_assessments",
      "draft_activities_care_plan_contributions",
      "complete_quarterly_activities_progress_notes",
      "review_staff_notes_when_assigned"
    ],
    restrictedByDefault: [
      "Finalize or co-sign only when organization permissions grant that action."
    ]
  },
  activities_assistant: {
    label: "Activities Assistant",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "document_participation_and_response",
      "document_prompting_and_adaptations",
      "document_preferences_and_barriers",
      "submit_care_plan_observations"
    ],
    restrictedByDefault: [
      "Draft, but do not automatically finalize, assessments or care plans."
    ]
  },
  activities_staff_member: {
    label: "Activities Staff Member",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "document_participation_and_response",
      "document_prompting_and_adaptations",
      "document_preferences_and_barriers",
      "submit_care_plan_observations"
    ],
    restrictedByDefault: [
      "Draft, but do not automatically finalize, assessments or care plans."
    ]
  },
  therapeutic_recreation_specialist: {
    label: "Therapeutic Recreation Specialist",
    defaultPermissions: [
      "create_activities_progress_notes",
      "create_individual_activity_notes",
      "create_group_activity_notes",
      "create_activities_evaluations",
      "draft_activities_assessments",
      "draft_activities_care_plan_contributions",
      "document_participation_and_response",
      "document_prompting_and_adaptations"
    ],
    restrictedByDefault: [
      "Do not infer independent clinical authority unless a separate verified credential and permission support it."
    ]
  },
  other_activities_staff: {
    label: "Other Activities Services Staff",
    defaultPermissions: [
      "create_activities_progress_notes",
      "document_participation_and_response",
      "document_prompting_and_adaptations",
      "document_preferences_and_barriers",
      "submit_care_plan_observations"
    ],
    restrictedByDefault: [
      "Organization administrator should configure local title permissions before finalization rights are granted."
    ]
  }
};

export const activitiesProgressNoteTemplate = [
  "Activity or Service Provided",
  "Care-Plan Goal Addressed",
  "Participation and Response",
  "Assistance or Adaptations",
  "Outcome and Follow-Up",
  "Signature"
];

export const activitiesCarePlanContributionTemplate = [
  "Participant Strengths and Interests",
  "Activities Needs and Barriers",
  "Measurable Activities Goals",
  "Planned Interventions and Frequency",
  "Responsible Discipline and Target Review Date",
  "Progress / IDT Review"
];

export const quarterlyActivitiesReviewTemplate = [
  "Quarterly Activities Summary",
  "Participation Patterns",
  "Progress Toward Activities Goals",
  "Barriers and Adaptations",
  "Care Plan Updates / IDT Follow-Up"
];

export const activitiesClinicalSafeguardInstruction =
  "Activities Services documentation must use objective observations, participation, response, preferences, supports, adaptations, and follow-up. Do not generate psychiatric diagnoses, medical diagnoses, mental-status conclusions, suicide-risk conclusions, homicide-risk conclusions, psychosis conclusions, medical-necessity determinations, service eligibility determinations, MCG criteria, or insurance-approval conclusions unless the authorized source information, role, and permission clearly support that content.";
