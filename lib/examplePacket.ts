import type { IntakePacket } from "@/types/intake";
import { defaultValues, mentalStatusQuestions } from "./defaultValues";

export const examplePacket: IntakePacket = {
  ...defaultValues,
  company: {
    name: "Example Adult Day Health Center",
    logoUrl: "",
    address: "100 Example Center Drive",
    cityStateZip: "Example City, NJ 00000",
    phone: "(555) 010-2000",
    fax: "(555) 010-2001",
    email: "intake@example-center.test",
    tagline: "Supportive care, structure, and community",
    administrator: "Pat Sample, Administrator",
    footerText: "Example Adult Day Health Center | Fictitious training sample",
    therapyProviderName: "Example Therapy Partners",
    therapyProviderPhone: "(555) 010-3020",
    therapyProviderEmail: "therapy@example-center.test"
  },
  identifying: {
    participantName: "Fictitious Participant A",
    medicaidId: "EXAMPLE-000123",
    dateOfBirth: "1948-05-14",
    dateOfIntake: "2026-07-06",
    evaluatorName: "Taylor Practice, LSW",
    evaluatorDiscipline: "Licensed Social Worker",
    primaryLanguage: "English",
    interpreterNeeded: "no",
    guardianProxyOnFile: "yes",
    guardianProxyName: "Jordan Example, adult child"
  },
  living: {
    currentResidence: "Private apartment in senior housing.",
    livesWith: "Alone, with family visiting several times per week.",
    stairsInside: "0",
    stairsOutside: "4",
    elevatorAccess: "yes",
    primaryCaregiver: "Jordan Example, adult child",
    caregiverPhone: "(555) 010-1010",
    caregiverStressNoted: "yes",
    transportation: "Center transportation requested for program attendance."
  },
  functional: {
    orientation: "Usually oriented to person and place; occasional date confusion.",
    memoryConcerns: "Short-term memory concerns reported by family.",
    decisionMaking: "Some assistance for appointments and benefits paperwork.",
    ambulation: "Uses rolling walker for longer distances.",
    transfers: "Supervision recommended for safety.",
    adlHelp: "Needs cueing with bathing and dressing; independent with feeding.",
    recentFalls: "One non-injury fall reported in the last 6 months."
  },
  communication: {
    primaryCommunication: "Verbal",
    hearingStatus: "Hard of hearing in groups",
    hearingAids: "yes",
    visionStatus: "Impaired distance vision",
    glasses: "yes",
    communicationNeeds: "Face participant when speaking; allow extra response time."
  },
  psychosocial: {
    baselineMood: "Generally pleasant; mild anxiety when routines change.",
    mentalHealthHistory: "Family reports history of depression treated by PCP.",
    currentStressors: "Reduced independence, caregiver availability, transportation.",
    strengthsCoping: "Enjoys music, structured activities, and family phone calls.",
    socialEngagement: "Limited at home; interested in center activities.",
    thoughtBehaviorConcerns: "No psychosis reported. May become tearful when overwhelmed."
  },
  medicalHistory: {
    primaryCareProvider: "Example Primary Care Group",
    pcpPhone: "(555) 010-4040",
    majorMedicalDiagnoses: "Hypertension, type 2 diabetes, osteoarthritis.",
    psychiatricDiagnoses: "Depression by history.",
    currentMedications: "Example medication list attached by family.",
    allergies: "No known drug allergies reported in sample.",
    psychiatricHospitalization: "no",
    psychiatricHospitalizationDetails: "None reported.",
    suicideSelfHarmHistory: "no",
    currentRiskDetails: "Denies current suicidal or homicidal ideation in sample.",
    substanceUseHistory: "No current substance use concerns reported.",
    alcoholUse: "No current alcohol use reported.",
    drugUse: "No non-prescribed drug use reported.",
    otherHistory: "Family requests social work support for benefits questions."
  },
  conditions: {
    medicationManagement: "Family fills weekly pill organizer.",
    medicationAdherenceConcerns: "Occasional missed evening dose per caregiver.",
    appetite: "Fair",
    specialDiet: "Consistent carbohydrate diet recommended.",
    recentWeightChange: "No significant recent change reported.",
    oralDentalStatus: "Upper dentures; no current pain reported.",
    skinCondition: "Skin intact; monitor lower extremity edema."
  },
  safety: {
    assistiveDevices: "Rolling walker, glasses, hearing aids.",
    specialTreatments: "Blood glucose monitoring per physician order.",
    harmRisk: "No current risk of harm to self or others reported.",
    abuseNeglectConcerns: "None reported during sample intake.",
    elopementRisk: "Low; needs orientation to center exits and routines.",
    safetyPrecautions: "Fall precautions, walker within reach, hydration reminders."
  },
  goals: {
    participantFamilyGoals:
      "Improve socialization, maintain routine, reduce isolation, and support caregiver respite.",
    socialWorkServicesNeeded:
      "Benefits counseling, caregiver support, referral coordination, and adjustment support.",
    servicePriorities:
      "Promote safe attendance, increase activity engagement, monitor mood, support care planning."
  },
  attachments: {
    documents: [
      "ID",
      "Insurance card",
      "Medicaid card",
      "Medication list",
      "Physician orders"
    ],
    otherDocuments: "Sample advance directive requested from family.",
    notes: "All documents listed are fictitious placeholders for training."
  },
  mentalStatus: {
    responses: mentalStatusQuestions.map((question, index) => ({
      question,
      status: index === 2 || index === 9 ? "incorrect" : "correct",
      notes:
        index === 2
          ? "Gave month correctly but incorrect day."
          : index === 9
            ? "Unable to recall prior president in sample."
            : ""
    })),
    screeningNote: true
  },
  homeVisit: {
    name: "Fictitious Participant A",
    dob: "1948-05-14",
    sex: "Female",
    address: "22 Sample Apartment, Example City, NJ 00000",
    phone: "(555) 010-1111",
    cell: "(555) 010-1112",
    email: "participant-a@example.test",
    livingArrangements: "Lives alone in senior apartment.",
    householdComposition: "One-person household; adult child nearby.",
    closestRelative: "Jordan Example, adult child",
    frequencyOfVisits: "Two to three visits weekly.",
    groupCommunitySupports: "Faith community phone support.",
    shoppingAvailability: "Family shops weekly; delivery available.",
    publicTransportation: "Limited use due to mobility concerns.",
    structuralEnvironment: "Apartment building with elevator access.",
    entrance: "Level entrance with automatic door.",
    livingRoom: "Clear pathways with walker access.",
    kitchen: "Needs reminders for stove safety.",
    bathroom: "Grab bars present; shower chair recommended.",
    bedroom: "Bed height appropriate.",
    roomsOneLevel: "yes",
    telephones: "Cell phone and landline available.",
    roomAppearance: "Clean, organized, adequate lighting.",
    carpeting: "Area rug in living room.",
    safetyHazards: ["Scatter rugs", "Poor lighting"],
    otherSafetyHazard: "Recommend night lights in hallway.",
    comments: "Sample home visit indicates manageable environment with fall-risk modifications."
  },
  consents: {
    medicalRelease: {
      to: "Example Primary Care Group",
      participantName: "Fictitious Participant A",
      participantSignature: "Fictitious Participant A",
      responsiblePartyName: "Jordan Example",
      responsiblePartySignature: "Jordan Example",
      unableReason: "",
      witness: "Taylor Practice, LSW",
      date: "2026-07-06"
    },
    advanceDirective: {
      clientPrintedName: "Fictitious Participant A",
      clientSignature: "Fictitious Participant A",
      clientDate: "2026-07-06",
      responsiblePrintedName: "Jordan Example",
      responsibleSignature: "Jordan Example",
      responsibleDate: "2026-07-06"
    },
    videoSurveillance: {
      participantRepresentativeSignature: "Fictitious Participant A",
      participantDate: "2026-07-06",
      witness: "Taylor Practice, LSW",
      witnessDate: "2026-07-06"
    },
    transportation: {
      memberFirstName: "Fictitious",
      memberLastName: "Participant A",
      canBeLeftUnsupervised: "no",
      memberSignature: "Fictitious Participant A",
      date: "2026-07-06",
      teamMemberFirstName: "Alex",
      teamMemberLastName: "Careteam"
    },
    fieldTrips: {
      permission: true,
      signature: "Jordan Example",
      date: "2026-07-06"
    },
    pictures: {
      permission: false,
      signature: "Jordan Example",
      date: "2026-07-06"
    },
    ombudsperson: {
      primaryContactName: "Jordan Example",
      primaryAddress: "44 Family Contact Road, Example City, NJ 00000",
      primaryTelephone: "(555) 010-1010",
      primaryCell: "(555) 010-1011",
      primaryEmail: "jordan.example@example.test",
      additionalName: "Case Manager Example",
      additionalAddress: "Agency address on file",
      additionalTelephone: "(555) 010-5050",
      additionalCell: "(555) 010-5051",
      additionalEmail: "case.manager@example.test",
      participantSignature: "Fictitious Participant A",
      participantDate: "2026-07-06",
      witnessSignature: "Taylor Practice, LSW",
      witnessDate: "2026-07-06"
    }
  },
  initialDischarge: {
    assessmentDate: "2026-07-06",
    clientName: "Fictitious Participant A",
    dob: "1948-05-14",
    clientStatus: ["Alert", "Oriented", "Forgetful"],
    socialization: "Limited",
    participation: [
      "Participation in activities of choice",
      "Limited participation"
    ],
    participationNotes: "Participant is expected to benefit from structured small-group activities.",
    livingAdls: [
      "Lives alone / manages well",
      "Lives with family / assisted by family"
    ],
    levelOfServiceAppropriate: "yes",
    mobility: "Assisted by mechanical / electronic device",
    mobilityNotes: "Uses rolling walker; fall precautions recommended.",
    socialServicesSignature: "Taylor Practice, LSW",
    socialServicesDate: "2026-07-06"
  },
  roi: {
    memberName: "Fictitious Participant A",
    phone: "(555) 010-1111",
    dateOfBirth: "1948-05-14",
    ssnLast4: "0000",
    recipientName: "Example Primary Care Group",
    recipientOrganization: "Example Primary Care Group",
    recipientAddress: "500 Provider Plaza, Example City, NJ 00000",
    recipientPhone: "(555) 010-4040",
    recipientFax: "(555) 010-4041",
    informationReleased: [
      "Psychosocial assessment / intake",
      "Care plan / treatment plan",
      "Medication list and relevant medical updates"
    ],
    otherInformation: "",
    disclosurePurpose: ["Care coordination / continuity of care"],
    otherPurpose: "",
    expiration: "One year from signature date",
    revocationAcknowledgment: "Member may revoke in writing except where action has already been taken.",
    memberSignature: "Fictitious Participant A",
    printedName: "Fictitious Participant A",
    date: "2026-07-06",
    relationshipToMember: "Self",
    witnessSignature: "Taylor Practice, LSW",
    witnessDate: "2026-07-06"
  },
  quarterlyDischarge: {
    participantName: "Fictitious Participant A",
    admissionDate: "2026-07-08",
    dischargeSetting: "Home with family / caregiver",
    familyCaregiverSpecify: "Adult child support and home care referral if needed.",
    otherSettingSpecify: "",
    settingComments: "Goal is continued community living with supports.",
    supportiveServices: ["Home care", "Meals on Wheels", "Mental health"],
    otherServiceSpecify: "",
    servicesComments: "Monitor need for added home support during quarterly reviews.",
    socialWorkerSignature: "Taylor Practice, LSW",
    date: "2026-07-06",
    longTermCareReferralNote: "Long-term care referral may be considered if family support changes."
  },
  therapy: {
    providerDescription:
      "Example Therapy Partners may provide on-site therapy services coordinated with Example Adult Day Health Center when ordered and authorized.",
    authorizeTherapy: true,
    discussFurther: false,
    callbackPhone: "(555) 010-1010",
    clientName: "Fictitious Participant A",
    representativeSignature: "Jordan Example",
    date: "2026-07-06"
  }
};
