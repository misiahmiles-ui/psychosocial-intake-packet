import type { FieldDefinition, IntakeStep, Option } from "@/types/intake";
import { BRAND_PLACEHOLDERS } from "./placeholders";

const yesNo: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" }
];

const yesNoUnknown: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Unknown", value: "unknown" }
];

const text = (
  path: string,
  label: string,
  overrides: Partial<FieldDefinition> = {}
): FieldDefinition => ({
  path,
  label,
  kind: "text",
  ...overrides
});

const textarea = (
  path: string,
  label: string,
  overrides: Partial<FieldDefinition> = {}
): FieldDefinition => ({
  path,
  label,
  kind: "textarea",
  full: true,
  ...overrides
});

export const INTAKE_STEPS: IntakeStep[] = [
  {
    id: "company",
    title: "Company / Facility Setup",
    shortTitle: "Company",
    eyebrow: "Step 1",
    description:
      "Configure the white-label details that populate headers, consent language, and exports.",
    fields: [
      text("company.name", "Company name", {
        placeholder: BRAND_PLACEHOLDERS.companyName,
        required: true
      }),
      text("company.logoUrl", "Upload Company Logo", {
        kind: "logoUpload",
        full: true,
        placeholder: BRAND_PLACEHOLDERS.logo,
        helpText:
          "Logo is used only during the current browser session and is included in downloaded/printed packet output when available. This app does not store uploaded logos."
      }),
      text("company.address", "Address", {
        placeholder: BRAND_PLACEHOLDERS.address,
        full: true
      }),
      text("company.cityStateZip", "City, state ZIP", {
        placeholder: BRAND_PLACEHOLDERS.cityStateZip
      }),
      text("company.phone", "Phone", {
        kind: "tel",
        placeholder: BRAND_PLACEHOLDERS.phone
      }),
      text("company.fax", "Fax", {
        kind: "tel",
        placeholder: BRAND_PLACEHOLDERS.fax
      }),
      text("company.email", "Email", {
        kind: "email",
        placeholder: BRAND_PLACEHOLDERS.email
      }),
      text("company.tagline", "Tagline", {
        placeholder: BRAND_PLACEHOLDERS.tagline
      }),
      text("company.administrator", "Administrator / contact person", {
        placeholder: BRAND_PLACEHOLDERS.administrator
      }),
      textarea("company.footerText", "Optional custom footer text"),
      text("company.therapyProviderName", "Therapy provider name", {
        placeholder: BRAND_PLACEHOLDERS.therapyProviderName
      }),
      text("company.therapyProviderPhone", "Therapy provider phone", {
        kind: "tel",
        placeholder: BRAND_PLACEHOLDERS.therapyProviderPhone
      }),
      text("company.therapyProviderEmail", "Therapy provider email", {
        kind: "email",
        placeholder: BRAND_PLACEHOLDERS.therapyProviderEmail
      })
    ]
  },
  {
    id: "identifying",
    title: "Identifying Information",
    shortTitle: "Identity",
    eyebrow: "Step 2",
    description:
      "Basic participant and evaluator details required before final export.",
    fields: [
      text("identifying.participantName", "Participant name", {
        required: true
      }),
      text("identifying.medicaidId", "Medicaid ID"),
      text("identifying.dateOfBirth", "Date of birth", {
        kind: "date",
        required: true
      }),
      text("identifying.dateOfIntake", "Date of intake", {
        kind: "date",
        required: true
      }),
      text("identifying.evaluatorName", "Evaluator name"),
      text("identifying.evaluatorDiscipline", "Evaluator discipline"),
      text("identifying.primaryLanguage", "Primary language"),
      {
        path: "identifying.interpreterNeeded",
        label: "Interpreter needed",
        kind: "radio",
        options: yesNoUnknown
      },
      {
        path: "identifying.guardianProxyOnFile",
        label: "Guardian / health care proxy on file",
        kind: "radio",
        options: yesNoUnknown
      },
      text("identifying.guardianProxyName", "Guardian / proxy name")
    ]
  },
  {
    id: "living",
    title: "Living Situation and Supports",
    shortTitle: "Supports",
    eyebrow: "Step 3",
    description:
      "Residence, household supports, caregiver details, and transportation.",
    fields: [
      textarea("living.currentResidence", "Current residence"),
      text("living.livesWith", "Lives with"),
      text("living.stairsInside", "Number of stairs inside home", {
        kind: "number"
      }),
      text("living.stairsOutside", "Number of stairs outside home", {
        kind: "number"
      }),
      {
        path: "living.elevatorAccess",
        label: "Elevator access",
        kind: "radio",
        options: yesNoUnknown
      },
      text("living.primaryCaregiver", "Primary caregiver name / relationship"),
      text("living.caregiverPhone", "Caregiver phone", { kind: "tel" }),
      {
        path: "living.caregiverStressNoted",
        label: "Caregiver stress noted",
        kind: "radio",
        options: yesNoUnknown
      },
      textarea("living.transportation", "Transportation to / from center")
    ]
  },
  {
    id: "functional",
    title: "Functional and Cognitive Status",
    shortTitle: "Function",
    eyebrow: "Step 4",
    description:
      "Functional support needs, cognition, transfers, ambulation, ADLs, and recent falls.",
    fields: [
      textarea("functional.orientation", "Orientation"),
      textarea("functional.memoryConcerns", "Memory concerns"),
      text("functional.decisionMaking", "Decision-making"),
      text("functional.ambulation", "Ambulation"),
      text("functional.transfers", "Transfers"),
      textarea("functional.adlHelp", "ADL help"),
      textarea("functional.recentFalls", "Recent falls in last 6 months")
    ]
  },
  {
    id: "communication",
    title: "Communication, Hearing, and Vision",
    shortTitle: "Communication",
    eyebrow: "Step 5",
    description:
      "Communication method, sensory supports, and barriers to effective engagement.",
    fields: [
      text("communication.primaryCommunication", "Primary communication"),
      text("communication.hearingStatus", "Hearing status"),
      {
        path: "communication.hearingAids",
        label: "Hearing aids",
        kind: "radio",
        options: yesNoUnknown
      },
      text("communication.visionStatus", "Vision status"),
      {
        path: "communication.glasses",
        label: "Glasses",
        kind: "radio",
        options: yesNoUnknown
      },
      textarea("communication.communicationNeeds", "Communication needs / barriers")
    ]
  },
  {
    id: "psychosocial",
    title: "Psychosocial and Behavioral Health",
    shortTitle: "Behavioral",
    eyebrow: "Step 6",
    description:
      "Mood, current stressors, coping strengths, social engagement, and behavior concerns.",
    fields: [
      text("psychosocial.baselineMood", "Baseline mood"),
      textarea("psychosocial.mentalHealthHistory", "Mental health history"),
      textarea("psychosocial.currentStressors", "Current stressors"),
      textarea("psychosocial.strengthsCoping", "Strengths and coping skills"),
      text("psychosocial.socialEngagement", "Social engagement"),
      textarea(
        "psychosocial.thoughtBehaviorConcerns",
        "Thought content / behavior concerns"
      )
    ]
  },
  {
    id: "medical-history",
    title: "Medical / Psychiatric History",
    shortTitle: "History",
    eyebrow: "Step 7",
    description:
      "Providers, diagnoses, medications, allergies, psychiatric history, risk, and substance use.",
    fields: [
      text("medicalHistory.primaryCareProvider", "Primary care provider"),
      text("medicalHistory.pcpPhone", "PCP phone", { kind: "tel" }),
      textarea("medicalHistory.majorMedicalDiagnoses", "Major medical diagnoses"),
      textarea("medicalHistory.psychiatricDiagnoses", "Psychiatric diagnoses"),
      textarea("medicalHistory.currentMedications", "Current medications"),
      textarea("medicalHistory.allergies", "Allergies / medication intolerances"),
      {
        path: "medicalHistory.psychiatricHospitalization",
        label: "History of psychiatric hospitalization",
        kind: "radio",
        options: yesNoUnknown
      },
      textarea(
        "medicalHistory.psychiatricHospitalizationDetails",
        "Dates / facilities / reasons"
      ),
      {
        path: "medicalHistory.suicideSelfHarmHistory",
        label: "History of suicide attempts or self-harm",
        kind: "radio",
        options: yesNoUnknown
      },
      textarea("medicalHistory.currentRiskDetails", "Current risk details"),
      textarea("medicalHistory.substanceUseHistory", "Substance use history"),
      textarea("medicalHistory.alcoholUse", "Alcohol use"),
      textarea("medicalHistory.drugUse", "Drug use"),
      textarea("medicalHistory.otherHistory", "Other relevant history")
    ]
  },
  {
    id: "conditions",
    title: "Medical Conditions, Nutrition, Oral, and Skin",
    shortTitle: "Conditions",
    eyebrow: "Step 8",
    description:
      "Medication management, diet, weight changes, dental status, and skin condition.",
    fields: [
      text("conditions.medicationManagement", "Medication management"),
      textarea(
        "conditions.medicationAdherenceConcerns",
        "Medication adherence concerns"
      ),
      text("conditions.appetite", "Appetite"),
      text("conditions.specialDiet", "Special diet"),
      text("conditions.recentWeightChange", "Recent weight change"),
      textarea("conditions.oralDentalStatus", "Oral / dental status"),
      textarea("conditions.skinCondition", "Skin condition")
    ]
  },
  {
    id: "safety",
    title: "Special Treatments, Assistive Devices, and Safety",
    shortTitle: "Safety",
    eyebrow: "Step 9",
    description:
      "Assistive devices, special treatments, harm risk, protection concerns, and precautions.",
    fields: [
      textarea("safety.assistiveDevices", "Assistive devices"),
      textarea("safety.specialTreatments", "Special treatments"),
      textarea("safety.harmRisk", "Risk of harm to self or others"),
      textarea(
        "safety.abuseNeglectConcerns",
        "Abuse / neglect / exploitation concerns"
      ),
      textarea("safety.elopementRisk", "Elopement / wandering risk"),
      textarea("safety.safetyPrecautions", "Safety precautions")
    ]
  },
  {
    id: "goals",
    title: "Participant Goals and Service Needs",
    shortTitle: "Goals",
    eyebrow: "Step 10",
    description:
      "Participant or family goals and recommended social work service priorities.",
    fields: [
      textarea(
        "goals.participantFamilyGoals",
        "Participant / family goals for adult day health services"
      ),
      textarea("goals.socialWorkServicesNeeded", "Social work services needed"),
      textarea(
        "goals.servicePriorities",
        "Recommended service priorities for plan of care"
      )
    ]
  },
  {
    id: "attachments",
    title: "Attachments Checklist",
    shortTitle: "Attachments",
    eyebrow: "Step 11",
    description:
      "Track documents gathered for the packet without storing actual files in this demo.",
    fields: [
      {
        path: "attachments.documents",
        label: "Documents received",
        kind: "checkboxGroup",
        full: true,
        options: [
          { label: "ID", value: "ID" },
          { label: "Insurance card", value: "Insurance card" },
          { label: "Medicaid card", value: "Medicaid card" },
          { label: "Advance directive", value: "Advance directive" },
          { label: "Medication list", value: "Medication list" },
          { label: "Physician orders", value: "Physician orders" },
          { label: "Other documents", value: "Other documents" }
        ]
      },
      text("attachments.otherDocuments", "Other documents"),
      textarea("attachments.notes", "Notes / comments")
    ]
  },
  {
    id: "mental-status",
    title: "Brief Mental Status Screening",
    shortTitle: "Screening",
    eyebrow: "Step 12",
    description:
      "Interactive Modified Kahn-style screening with automatic scoring. This is a screening aid, not a standalone diagnosis.",
    custom: "mental-status"
  },
  {
    id: "home-visit",
    title: "Home Visit Evaluation",
    shortTitle: "Home Visit",
    eyebrow: "Step 13",
    description:
      "Living arrangements, home environment, supports, and safety observations.",
    groups: [
      {
        title: "Participant and Household",
        fields: [
          text("homeVisit.name", "Name"),
          text("homeVisit.dob", "DOB", { kind: "date" }),
          text("homeVisit.sex", "Sex"),
          textarea("homeVisit.address", "Address"),
          text("homeVisit.phone", "Phone", { kind: "tel" }),
          text("homeVisit.cell", "Cell", { kind: "tel" }),
          text("homeVisit.email", "Email", { kind: "email" }),
          textarea("homeVisit.livingArrangements", "Living arrangements"),
          textarea("homeVisit.householdComposition", "Household composition"),
          text("homeVisit.closestRelative", "Closest relative"),
          text("homeVisit.frequencyOfVisits", "Frequency of visits"),
          text(
            "homeVisit.groupCommunitySupports",
            "Group / church / community supports"
          ),
          text("homeVisit.shoppingAvailability", "Shopping availability"),
          text("homeVisit.publicTransportation", "Public transportation")
        ]
      },
      {
        title: "Structural Environment",
        fields: [
          textarea("homeVisit.structuralEnvironment", "Structural environment"),
          text("homeVisit.entrance", "Entrance"),
          text("homeVisit.livingRoom", "Living room"),
          text("homeVisit.kitchen", "Kitchen"),
          text("homeVisit.bathroom", "Bathroom"),
          text("homeVisit.bedroom", "Bedroom"),
          {
            path: "homeVisit.roomsOneLevel",
            label: "Rooms on one level",
            kind: "radio",
            options: yesNoUnknown
          },
          text("homeVisit.telephones", "Telephones"),
          textarea("homeVisit.roomAppearance", "Appearance of rooms"),
          text("homeVisit.carpeting", "Carpeting"),
          {
            path: "homeVisit.safetyHazards",
            label: "Safety hazards",
            kind: "checkboxGroup",
            full: true,
            options: [
              { label: "Space heaters", value: "Space heaters" },
              { label: "Poor lighting", value: "Poor lighting" },
              {
                label: "Poor structure of stairs",
                value: "Poor structure of stairs"
              },
              { label: "Scatter rugs", value: "Scatter rugs" },
              { label: "Clutter", value: "Clutter" },
              { label: "No handrails", value: "No handrails" },
              { label: "Other", value: "Other" }
            ]
          },
          text("homeVisit.otherSafetyHazard", "Other safety hazard"),
          textarea("homeVisit.comments", "Comments")
        ]
      }
    ]
  },
  {
    id: "consents",
    title: "Authorizations and Consents",
    shortTitle: "Consents",
    eyebrow: "Step 14",
    description:
      "White-label authorization and consent screens using company placeholders.",
    groups: [
      {
        title: "Authorization for Release of Medical Information",
        description:
          "Authorizes release of records requested by [Company Name]. A photocopy may be treated as valid as the original.",
        fields: [
          text("consents.medicalRelease.to", "To"),
          text("consents.medicalRelease.participantName", "Participant name"),
          text(
            "consents.medicalRelease.participantSignature",
            "Participant signature"
          ),
          text(
            "consents.medicalRelease.responsiblePartyName",
            "Responsible party name"
          ),
          text(
            "consents.medicalRelease.responsiblePartySignature",
            "Responsible party signature"
          ),
          textarea(
            "consents.medicalRelease.unableReason",
            "Reason participant unable to sign"
          ),
          text("consents.medicalRelease.witness", "Witness"),
          text("consents.medicalRelease.date", "Date", { kind: "date" })
        ]
      },
      {
        title: "Advance Directive Policy Acknowledgment",
        description:
          "[Company Name] recognizes each client's right to make decisions about medical procedures and will keep advance directive documentation in the client record when provided.",
        fields: [
          text(
            "consents.advanceDirective.clientPrintedName",
            "Client printed name"
          ),
          text("consents.advanceDirective.clientSignature", "Client signature"),
          text("consents.advanceDirective.clientDate", "Date", { kind: "date" }),
          text(
            "consents.advanceDirective.responsiblePrintedName",
            "Responsible party printed name"
          ),
          text(
            "consents.advanceDirective.responsibleSignature",
            "Responsible party signature"
          ),
          text("consents.advanceDirective.responsibleDate", "Date", {
            kind: "date"
          })
        ]
      },
      {
        title: "Authorization for Video Surveillance",
        description:
          "Acknowledges safety-focused video monitoring in permitted center areas and excludes areas with a higher expectation of privacy.",
        fields: [
          text(
            "consents.videoSurveillance.participantRepresentativeSignature",
            "Participant / legal representative signature"
          ),
          text("consents.videoSurveillance.participantDate", "Date", {
            kind: "date"
          }),
          text("consents.videoSurveillance.witness", "Witness"),
          text("consents.videoSurveillance.witnessDate", "Date", {
            kind: "date"
          })
        ]
      },
      {
        title: "Transportation Guidelines Acknowledgment",
        description:
          "Acknowledges transportation expectations, pickup readiness, notification needs, seat belt use, and drop-off supervision preference for [Company Name].",
        fields: [
          text("consents.transportation.memberFirstName", "Member first name"),
          text("consents.transportation.memberLastName", "Member last name"),
          {
            path: "consents.transportation.canBeLeftUnsupervised",
            label: "Member can be left unsupervised when dropped off",
            kind: "radio",
            options: yesNo
          },
          text("consents.transportation.memberSignature", "Member signature"),
          text("consents.transportation.date", "Date", { kind: "date" }),
          text(
            "consents.transportation.teamMemberFirstName",
            "Company team member first name"
          ),
          text(
            "consents.transportation.teamMemberLastName",
            "Company team member last name"
          )
        ]
      },
      {
        title: "Authorization for Field Trips",
        description:
          "Permission for the participant to join center field trips and ride in vehicles driven by employees or transportation providers.",
        fields: [
          {
            path: "consents.fieldTrips.permission",
            label: "Permission granted",
            kind: "checkbox",
            full: true
          },
          text("consents.fieldTrips.signature", "Participant / legal representative signature"),
          text("consents.fieldTrips.date", "Date", { kind: "date" })
        ]
      },
      {
        title: "Authorization for Pictures",
        description:
          "Permission for pictures to be taken during center programming and used in family communications, events, or newsletters.",
        fields: [
          {
            path: "consents.pictures.permission",
            label: "Permission granted",
            kind: "checkbox",
            full: true
          },
          text("consents.pictures.signature", "Participant / legal representative signature"),
          text("consents.pictures.date", "Date", { kind: "date" })
        ]
      },
      {
        title: "Ombudsperson Disclosure Consent",
        description:
          "Names contacts authorized to receive investigation findings when disclosure is permitted.",
        fields: [
          text("consents.ombudsperson.primaryContactName", "Primary contact name"),
          textarea("consents.ombudsperson.primaryAddress", "Address"),
          text("consents.ombudsperson.primaryTelephone", "Telephone", {
            kind: "tel"
          }),
          text("consents.ombudsperson.primaryCell", "Cell", { kind: "tel" }),
          text("consents.ombudsperson.primaryEmail", "Email", { kind: "email" }),
          text(
            "consents.ombudsperson.additionalName",
            "Additional authorized person"
          ),
          textarea("consents.ombudsperson.additionalAddress", "Address"),
          text("consents.ombudsperson.additionalTelephone", "Telephone", {
            kind: "tel"
          }),
          text("consents.ombudsperson.additionalCell", "Cell", { kind: "tel" }),
          text("consents.ombudsperson.additionalEmail", "Email", {
            kind: "email"
          }),
          text(
            "consents.ombudsperson.participantSignature",
            "Participant / legal representative signature"
          ),
          text("consents.ombudsperson.participantDate", "Date", {
            kind: "date"
          }),
          text("consents.ombudsperson.witnessSignature", "Witness signature"),
          text("consents.ombudsperson.witnessDate", "Date", { kind: "date" })
        ]
      }
    ]
  },
  {
    id: "initial-discharge",
    title: "Social Services Initial Discharge Plan",
    shortTitle: "Initial Plan",
    eyebrow: "Step 15",
    description:
      "Initial social services assessment and projected discharge planning details.",
    fields: [
      text(
        "initialDischarge.assessmentDate",
        "Date of initial assessment / discharge plan",
        { kind: "date" }
      ),
      text("initialDischarge.clientName", "Client name"),
      text("initialDischarge.dob", "DOB", { kind: "date" }),
      {
        path: "initialDischarge.clientStatus",
        label: "Client status",
        kind: "checkboxGroup",
        full: true,
        options: [
          { label: "Alert", value: "Alert" },
          { label: "Oriented", value: "Oriented" },
          {
            label: "Able to communicate needs and wants",
            value: "Able to communicate needs and wants"
          },
          { label: "Confused", value: "Confused" },
          { label: "Disoriented", value: "Disoriented" },
          { label: "Forgetful", value: "Forgetful" },
          {
            label: "Non-verbal / unable to communicate needs and wants",
            value: "Non-verbal / unable to communicate needs and wants"
          }
        ]
      },
      {
        path: "initialDischarge.socialization",
        label: "Level of socialization",
        kind: "radio",
        options: [
          { label: "Appropriate", value: "Appropriate" },
          { label: "Limited", value: "Limited" },
          { label: "None", value: "None" }
        ]
      },
      {
        path: "initialDischarge.participation",
        label: "Expected participation",
        kind: "checkboxGroup",
        full: true,
        options: [
          { label: "Active participation", value: "Active participation" },
          {
            label: "Participation in activities of choice",
            value: "Participation in activities of choice"
          },
          { label: "Limited participation", value: "Limited participation" },
          {
            label: "Unable to participate due to condition",
            value: "Unable to participate due to condition"
          }
        ]
      },
      textarea("initialDischarge.participationNotes", "Additional notes"),
      {
        path: "initialDischarge.livingAdls",
        label: "Living arrangements / ADLs",
        kind: "checkboxGroup",
        full: true,
        options: [
          {
            label: "Lives alone / manages well",
            value: "Lives alone / manages well"
          },
          {
            label: "Lives with family / assisted by family",
            value: "Lives with family / assisted by family"
          },
          {
            label: "Assisted by home health aide",
            value: "Assisted by home health aide"
          },
          { label: "Lives in group home", value: "Lives in group home" }
        ]
      },
      {
        path: "initialDischarge.levelOfServiceAppropriate",
        label: "Level of service appropriate",
        kind: "radio",
        options: yesNoUnknown
      },
      {
        path: "initialDischarge.mobility",
        label: "Mobility",
        kind: "radio",
        options: [
          { label: "Independent", value: "Independent" },
          {
            label: "Assisted by mechanical / electronic device",
            value: "Assisted by mechanical / electronic device"
          }
        ]
      },
      textarea("initialDischarge.mobilityNotes", "Additional notes"),
      text("initialDischarge.socialServicesSignature", "Social services signature"),
      text("initialDischarge.socialServicesDate", "Date", { kind: "date" })
    ]
  },
  {
    id: "roi",
    title: "Authorization for Release of Information / ROI",
    shortTitle: "ROI",
    eyebrow: "Step 16",
    description:
      "Modern release authorization using [Company Name] throughout the packet export.",
    fields: [
      text("roi.memberName", "Member name"),
      text("roi.phone", "Phone", { kind: "tel" }),
      text("roi.dateOfBirth", "Date of birth", { kind: "date" }),
      text("roi.ssnLast4", "Last 4 of SSN, optional"),
      text("roi.recipientName", "Recipient name"),
      text("roi.recipientOrganization", "Recipient organization"),
      textarea("roi.recipientAddress", "Recipient address"),
      text("roi.recipientPhone", "Recipient phone", { kind: "tel" }),
      text("roi.recipientFax", "Recipient fax", { kind: "tel" }),
      {
        path: "roi.informationReleased",
        label: "Information to be released",
        kind: "checkboxGroup",
        full: true,
        options: [
          { label: "Quarterly progress notes", value: "Quarterly progress notes" },
          {
            label: "Psychosocial assessment / intake",
            value: "Psychosocial assessment / intake"
          },
          {
            label: "Care plan / treatment plan",
            value: "Care plan / treatment plan"
          },
          {
            label: "Attendance / participation records",
            value: "Attendance / participation records"
          },
          {
            label: "Medication list and relevant medical updates",
            value: "Medication list and relevant medical updates"
          },
          { label: "Other", value: "Other" }
        ]
      },
      text("roi.otherInformation", "Other information"),
      {
        path: "roi.disclosurePurpose",
        label: "Purpose of disclosure",
        kind: "checkboxGroup",
        full: true,
        options: [
          {
            label: "Care coordination / continuity of care",
            value: "Care coordination / continuity of care"
          },
          {
            label: "Housing supports / benefits coordination",
            value: "Housing supports / benefits coordination"
          },
          {
            label: "Legal representation / court matters",
            value: "Legal representation / court matters"
          },
          { label: "Other", value: "Other" }
        ]
      },
      text("roi.otherPurpose", "Other purpose"),
      text("roi.expiration", "Expiration date / event"),
      textarea("roi.revocationAcknowledgment", "Revocation acknowledgment"),
      text("roi.memberSignature", "Member / personal representative signature"),
      text("roi.printedName", "Printed name"),
      text("roi.date", "Date", { kind: "date" }),
      text("roi.relationshipToMember", "Relationship to member"),
      text("roi.witnessSignature", "Witness signature"),
      text("roi.witnessDate", "Date", { kind: "date" })
    ]
  },
  {
    id: "quarterly-discharge",
    title: "Quarterly / Projected Discharge Plan",
    shortTitle: "Discharge",
    eyebrow: "Step 17",
    description:
      "Projected discharge setting and supportive services potentially needed.",
    fields: [
      text("quarterlyDischarge.participantName", "Participant name"),
      text("quarterlyDischarge.admissionDate", "Date of admission", {
        kind: "date"
      }),
      {
        path: "quarterlyDischarge.dischargeSetting",
        label: "Projected discharge setting",
        kind: "radio",
        full: true,
        options: [
          { label: "Home with self", value: "Home with self" },
          { label: "Home with spouse", value: "Home with spouse" },
          {
            label: "Home with family / caregiver",
            value: "Home with family / caregiver"
          },
          { label: "Assisted living", value: "Assisted living" },
          {
            label: "Skilled nursing facility",
            value: "Skilled nursing facility"
          },
          { label: "Other", value: "Other" }
        ]
      },
      text("quarterlyDischarge.familyCaregiverSpecify", "If family / caregiver, specify"),
      text("quarterlyDischarge.otherSettingSpecify", "If other, specify"),
      textarea("quarterlyDischarge.settingComments", "Comments"),
      {
        path: "quarterlyDischarge.supportiveServices",
        label: "Supportive services potentially needed",
        kind: "checkboxGroup",
        full: true,
        options: [
          { label: "Home care", value: "Home care" },
          { label: "Mental health", value: "Mental health" },
          { label: "DDD", value: "DDD" },
          { label: "Meals on Wheels", value: "Meals on Wheels" },
          { label: "Hospice", value: "Hospice" },
          { label: "Other", value: "Other" }
        ]
      },
      text("quarterlyDischarge.otherServiceSpecify", "Other supportive service"),
      textarea("quarterlyDischarge.servicesComments", "Comments"),
      text("quarterlyDischarge.socialWorkerSignature", "Social worker signature"),
      text("quarterlyDischarge.date", "Date", { kind: "date" }),
      textarea(
        "quarterlyDischarge.longTermCareReferralNote",
        "Long-term care referral note"
      )
    ]
  },
  {
    id: "therapy",
    title: "Optional Therapy Authorization",
    shortTitle: "Therapy",
    eyebrow: "Step 18",
    description:
      "Generic optional therapy authorization populated from company setup when a therapy provider is configured.",
    fields: [
      textarea("therapy.providerDescription", "Therapy provider description", {
        placeholder:
          "[Therapy Provider Name] may provide on-site therapy services coordinated with [Company Name]."
      }),
      {
        path: "therapy.authorizeTherapy",
        label: "I authorize therapy services",
        kind: "checkbox",
        full: true
      },
      {
        path: "therapy.discussFurther",
        label: "I wish to discuss further",
        kind: "checkbox",
        full: true
      },
      text("therapy.callbackPhone", "Phone number for callback", { kind: "tel" }),
      text("therapy.clientName", "Client name"),
      text(
        "therapy.representativeSignature",
        "Parent / guardian / legal representative signature"
      ),
      text("therapy.date", "Date", { kind: "date" })
    ]
  }
];

export function getAllFieldDefinitions(): FieldDefinition[] {
  return INTAKE_STEPS.flatMap((step) => [
    ...(step.fields ?? []),
    ...(step.groups?.flatMap((group) => group.fields) ?? [])
  ]);
}
