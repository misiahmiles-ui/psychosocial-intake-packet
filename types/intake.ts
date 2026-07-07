export type FieldKind =
  | "text"
  | "textarea"
  | "date"
  | "email"
  | "tel"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "checkboxGroup"
  | "logoUpload";

export type Option = {
  label: string;
  value: string;
};

export type FieldDefinition = {
  path: string;
  label: string;
  kind?: FieldKind;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  options?: Option[];
  helpText?: string;
};

export type SectionGroup = {
  title: string;
  description?: string;
  fields: FieldDefinition[];
};

export type IntakeStep = {
  id: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  fields?: FieldDefinition[];
  groups?: SectionGroup[];
  custom?: "mental-status";
};

export type SignatureValue = {
  name: string;
  date: string;
};

export type MentalStatusResponse = {
  question: string;
  status: "" | "correct" | "incorrect" | "unable";
  notes: string;
};

export type IntakePacket = {
  company: {
    name: string;
    logoUrl: string;
    address: string;
    cityStateZip: string;
    phone: string;
    fax: string;
    email: string;
    tagline: string;
    administrator: string;
    footerText: string;
    therapyProviderName: string;
    therapyProviderPhone: string;
    therapyProviderEmail: string;
  };
  identifying: {
    participantName: string;
    medicaidId: string;
    dateOfBirth: string;
    dateOfIntake: string;
    evaluatorName: string;
    evaluatorDiscipline: string;
    primaryLanguage: string;
    interpreterNeeded: string;
    guardianProxyOnFile: string;
    guardianProxyName: string;
  };
  living: Record<string, string>;
  functional: Record<string, string>;
  communication: Record<string, string>;
  psychosocial: Record<string, string>;
  medicalHistory: Record<string, string>;
  conditions: Record<string, string>;
  safety: Record<string, string>;
  goals: Record<string, string>;
  attachments: {
    documents: string[];
    otherDocuments: string;
    notes: string;
  };
  mentalStatus: {
    responses: MentalStatusResponse[];
    screeningNote: boolean;
  };
  homeVisit: {
    safetyHazards: string[];
    [key: string]: string | string[] | boolean;
  };
  consents: {
    medicalRelease: Record<string, string>;
    advanceDirective: Record<string, string>;
    videoSurveillance: Record<string, string>;
    transportation: Record<string, string>;
    fieldTrips: Record<string, string | boolean>;
    pictures: Record<string, string | boolean>;
    ombudsperson: Record<string, string>;
  };
  initialDischarge: {
    clientStatus: string[];
    socialization: string;
    participation: string[];
    livingAdls: string[];
    mobility: string;
    [key: string]: string | string[];
  };
  roi: {
    informationReleased: string[];
    disclosurePurpose: string[];
    [key: string]: string | string[];
  };
  quarterlyDischarge: {
    dischargeSetting: string;
    supportiveServices: string[];
    [key: string]: string | string[];
  };
  therapy: Record<string, string | boolean>;
};
