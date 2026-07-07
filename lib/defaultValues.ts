import type { IntakePacket, MentalStatusResponse } from "@/types/intake";

export const mentalStatusQuestions = [
  "What is the name of this place?",
  "Where is it located?",
  "What is today's date?",
  "What is the month now?",
  "What is the year?",
  "How old are you?",
  "When were you born, month?",
  "When were you born, year?",
  "Who is the president of the United States?",
  "Who was the president before him?"
];

const mentalStatusResponses: MentalStatusResponse[] = mentalStatusQuestions.map(
  (question) => ({
    question,
    status: "",
    notes: ""
  })
);

export const defaultValues: IntakePacket = {
  company: {
    name: "",
    logoUrl: "",
    address: "",
    cityStateZip: "",
    phone: "",
    fax: "",
    email: "",
    tagline: "",
    administrator: "",
    footerText: "",
    therapyProviderName: "",
    therapyProviderPhone: "",
    therapyProviderEmail: ""
  },
  identifying: {
    participantName: "",
    medicaidId: "",
    dateOfBirth: "",
    dateOfIntake: "",
    evaluatorName: "",
    evaluatorDiscipline: "",
    primaryLanguage: "",
    interpreterNeeded: "",
    guardianProxyOnFile: "",
    guardianProxyName: ""
  },
  living: {
    currentResidence: "",
    livesWith: "",
    stairsInside: "",
    stairsOutside: "",
    elevatorAccess: "",
    primaryCaregiver: "",
    caregiverPhone: "",
    caregiverStressNoted: "",
    transportation: ""
  },
  functional: {
    orientation: "",
    memoryConcerns: "",
    decisionMaking: "",
    ambulation: "",
    transfers: "",
    adlHelp: "",
    recentFalls: ""
  },
  communication: {
    primaryCommunication: "",
    hearingStatus: "",
    hearingAids: "",
    visionStatus: "",
    glasses: "",
    communicationNeeds: ""
  },
  psychosocial: {
    baselineMood: "",
    mentalHealthHistory: "",
    currentStressors: "",
    strengthsCoping: "",
    socialEngagement: "",
    thoughtBehaviorConcerns: ""
  },
  medicalHistory: {
    primaryCareProvider: "",
    pcpPhone: "",
    majorMedicalDiagnoses: "",
    psychiatricDiagnoses: "",
    currentMedications: "",
    allergies: "",
    psychiatricHospitalization: "",
    psychiatricHospitalizationDetails: "",
    suicideSelfHarmHistory: "",
    currentRiskDetails: "",
    substanceUseHistory: "",
    alcoholUse: "",
    drugUse: "",
    otherHistory: ""
  },
  conditions: {
    medicationManagement: "",
    medicationAdherenceConcerns: "",
    appetite: "",
    specialDiet: "",
    recentWeightChange: "",
    oralDentalStatus: "",
    skinCondition: ""
  },
  safety: {
    assistiveDevices: "",
    specialTreatments: "",
    harmRisk: "",
    abuseNeglectConcerns: "",
    elopementRisk: "",
    safetyPrecautions: ""
  },
  goals: {
    participantFamilyGoals: "",
    socialWorkServicesNeeded: "",
    servicePriorities: ""
  },
  attachments: {
    documents: [],
    otherDocuments: "",
    notes: ""
  },
  mentalStatus: {
    responses: mentalStatusResponses,
    screeningNote: false
  },
  homeVisit: {
    name: "",
    dob: "",
    sex: "",
    address: "",
    phone: "",
    cell: "",
    email: "",
    livingArrangements: "",
    householdComposition: "",
    closestRelative: "",
    frequencyOfVisits: "",
    groupCommunitySupports: "",
    shoppingAvailability: "",
    publicTransportation: "",
    structuralEnvironment: "",
    entrance: "",
    livingRoom: "",
    kitchen: "",
    bathroom: "",
    bedroom: "",
    roomsOneLevel: "",
    telephones: "",
    roomAppearance: "",
    carpeting: "",
    safetyHazards: [],
    otherSafetyHazard: "",
    comments: ""
  },
  consents: {
    medicalRelease: {
      to: "",
      participantName: "",
      participantSignature: "",
      responsiblePartyName: "",
      responsiblePartySignature: "",
      unableReason: "",
      witness: "",
      date: ""
    },
    advanceDirective: {
      clientPrintedName: "",
      clientSignature: "",
      clientDate: "",
      responsiblePrintedName: "",
      responsibleSignature: "",
      responsibleDate: ""
    },
    videoSurveillance: {
      participantRepresentativeSignature: "",
      participantDate: "",
      witness: "",
      witnessDate: ""
    },
    transportation: {
      memberFirstName: "",
      memberLastName: "",
      canBeLeftUnsupervised: "",
      memberSignature: "",
      date: "",
      teamMemberFirstName: "",
      teamMemberLastName: ""
    },
    fieldTrips: {
      permission: false,
      signature: "",
      date: ""
    },
    pictures: {
      permission: false,
      signature: "",
      date: ""
    },
    ombudsperson: {
      primaryContactName: "",
      primaryAddress: "",
      primaryTelephone: "",
      primaryCell: "",
      primaryEmail: "",
      additionalName: "",
      additionalAddress: "",
      additionalTelephone: "",
      additionalCell: "",
      additionalEmail: "",
      participantSignature: "",
      participantDate: "",
      witnessSignature: "",
      witnessDate: ""
    }
  },
  initialDischarge: {
    assessmentDate: "",
    clientName: "",
    dob: "",
    clientStatus: [],
    socialization: "",
    participation: [],
    participationNotes: "",
    livingAdls: [],
    levelOfServiceAppropriate: "",
    mobility: "",
    mobilityNotes: "",
    socialServicesSignature: "",
    socialServicesDate: ""
  },
  roi: {
    memberName: "",
    phone: "",
    dateOfBirth: "",
    ssnLast4: "",
    recipientName: "",
    recipientOrganization: "",
    recipientAddress: "",
    recipientPhone: "",
    recipientFax: "",
    informationReleased: [],
    otherInformation: "",
    disclosurePurpose: [],
    otherPurpose: "",
    expiration: "",
    revocationAcknowledgment: "",
    memberSignature: "",
    printedName: "",
    date: "",
    relationshipToMember: "",
    witnessSignature: "",
    witnessDate: ""
  },
  quarterlyDischarge: {
    participantName: "",
    admissionDate: "",
    dischargeSetting: "",
    familyCaregiverSpecify: "",
    otherSettingSpecify: "",
    settingComments: "",
    supportiveServices: [],
    otherServiceSpecify: "",
    servicesComments: "",
    socialWorkerSignature: "",
    date: "",
    longTermCareReferralNote: ""
  },
  therapy: {
    providerDescription: "",
    authorizeTherapy: false,
    discussFurther: false,
    callbackPhone: "",
    clientName: "",
    representativeSignature: "",
    date: ""
  }
};
