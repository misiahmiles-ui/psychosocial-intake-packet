// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
export const OTHER_DIAGNOSIS_ID = "other_entered" as const;
export const OTHER_DIAGNOSIS_OPTION = "Other / Enter Diagnosis" as const;

export const diagnosisRegistry = [
  {
    id: "major_depressive_disorder",
    label: "Major Depressive Disorder",
    aliases: [
      "MDD",
      "major depression",
      "clinical depression",
      "major depressive episode",
      "recurrent major depressive disorder"
    ]
  },
  {
    id: "anxiety_disorders",
    label: "Anxiety Disorders",
    aliases: [
      "Generalized Anxiety Disorder",
      "Generalised Anxiety Disorder",
      "GAD",
      "Panic Disorder",
      "Social Anxiety Disorder",
      "Social Phobia",
      "Separation Anxiety Disorder"
    ]
  },
  {
    id: "attention_deficit_disruptive_behavior_disorders",
    label: "Attention-Deficit and Disruptive Behavior Disorders",
    aliases: [
      "Attention-Deficit/Hyperactivity Disorder",
      "Attention Deficit Hyperactivity Disorder",
      "ADHD",
      "Oppositional Defiant Disorder",
      "ODD",
      "Conduct Disorder"
    ]
  },
  {
    id: "anorexia_nervosa",
    label: "Anorexia Nervosa",
    aliases: []
  },
  {
    id: "bipolar_disorders",
    label: "Bipolar Disorders",
    aliases: [
      "Bipolar Disorder",
      "Bipolar I Disorder",
      "Bipolar II Disorder",
      "Bipolar One Disorder",
      "Bipolar Two Disorder"
    ]
  },
  {
    id: "schizophrenia_spectrum_disorders",
    label: "Schizophrenia Spectrum Disorders",
    aliases: [
      "Schizophrenia Spectrum Disorder",
      "Schizophrenia",
      "Schizoaffective Disorder",
      "Schizoaffective Disorder, Bipolar Type"
    ]
  },
  {
    id: "post_traumatic_stress_disorder",
    label: "Post-Traumatic Stress Disorder",
    aliases: [
      "Posttraumatic Stress Disorder",
      "Post Traumatic Stress Disorder",
      "PTSD"
    ]
  },
  {
    id: "obsessive_compulsive_disorder",
    label: "Obsessive-Compulsive Disorder",
    aliases: ["Obsessive Compulsive Disorder", "OCD"]
  },
  {
    id: "persistent_depressive_disorder",
    label: "Persistent Depressive Disorder",
    aliases: ["Dysthymia", "Dysthymic Disorder"]
  },
  {
    id: "substance_use_disorder",
    label: "Substance Use Disorder",
    aliases: [
      "Substance-Related Disorders",
      "Alcohol Use Disorder",
      "Opioid Use Disorder"
    ]
  },
  {
    id: "bulimia_nervosa",
    label: "Bulimia Nervosa",
    aliases: []
  },
  {
    id: "other_psychotic_disorders",
    label: "Other Psychotic Disorders",
    aliases: []
  },
  {
    id: "other_psychiatric_disorders",
    label: "Other Psychiatric Disorders",
    aliases: []
  },
  {
    id: "autism_spectrum_disorder",
    label: "Autism Spectrum Disorder",
    aliases: ["Autism Spectrum Disorders", "ASD"]
  }
] as const;

export type CanonicalDiagnosisDefinition = (typeof diagnosisRegistry)[number];
export type CanonicalDiagnosisId = CanonicalDiagnosisDefinition["id"];
export type DiagnosisId = CanonicalDiagnosisId | typeof OTHER_DIAGNOSIS_ID;

export type ResolvedDiagnosis = {
  id: DiagnosisId | null;
  canonicalLabel: string;
  enteredLabel: string;
  matchedAlias: boolean;
  custom: boolean;
};

export const diagnosisDropdownOptions = Object.freeze([
  ...diagnosisRegistry.map((entry) => entry.label),
  OTHER_DIAGNOSIS_OPTION
]);

export function normalizeDiagnosisLabel(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const diagnosisById = new Map<CanonicalDiagnosisId, CanonicalDiagnosisDefinition>(
  diagnosisRegistry.map((entry) => [entry.id, entry])
);

const diagnosisByLabel = new Map<string, CanonicalDiagnosisDefinition>();
for (const entry of diagnosisRegistry) {
  for (const label of [entry.label, ...entry.aliases]) {
    const normalized = normalizeDiagnosisLabel(label);
    const existing = diagnosisByLabel.get(normalized);
    if (existing && existing.id !== entry.id) {
      throw new Error(`Diagnosis alias is ambiguous: ${label}`);
    }
    diagnosisByLabel.set(normalized, entry);
  }
}

export function diagnosisDefinitionById(
  id: string | null | undefined
): CanonicalDiagnosisDefinition | null {
  return id ? diagnosisById.get(id as CanonicalDiagnosisId) || null : null;
}

export function diagnosisDefinitionForLabel(
  value: string | null | undefined
): CanonicalDiagnosisDefinition | null {
  const normalized = normalizeDiagnosisLabel(value || "");
  return normalized ? diagnosisByLabel.get(normalized) || null : null;
}

export function resolveDiagnosis(
  value: string | null | undefined,
  suppliedId?: string | null
): ResolvedDiagnosis {
  const enteredLabel = (value || "").trim();
  if (!enteredLabel) {
    return {
      id: null,
      canonicalLabel: "",
      enteredLabel: "",
      matchedAlias: false,
      custom: false
    };
  }

  const byLabel = diagnosisDefinitionForLabel(enteredLabel);
  const byId = diagnosisDefinitionById(suppliedId);
  const match = byLabel || (byId && normalizeDiagnosisLabel(enteredLabel) === normalizeDiagnosisLabel(byId.label) ? byId : null);
  if (match) {
    return {
      id: match.id,
      canonicalLabel: match.label,
      enteredLabel,
      matchedAlias:
        normalizeDiagnosisLabel(enteredLabel) !==
        normalizeDiagnosisLabel(match.label),
      custom: false
    };
  }

  if (enteredLabel === OTHER_DIAGNOSIS_OPTION) {
    return {
      id: OTHER_DIAGNOSIS_ID,
      canonicalLabel: "",
      enteredLabel,
      matchedAlias: false,
      custom: true
    };
  }

  return {
    id: OTHER_DIAGNOSIS_ID,
    canonicalLabel: enteredLabel,
    enteredLabel,
    matchedAlias: false,
    custom: true
  };
}

export function labelsForDiagnosisId(id: CanonicalDiagnosisId) {
  const definition = diagnosisDefinitionById(id);
  return definition
    ? [definition.label, ...definition.aliases]
    : [];
}

export function diagnosesAreEquivalent(left: string, right: string) {
  const leftDefinition = diagnosisDefinitionForLabel(left);
  const rightDefinition = diagnosisDefinitionForLabel(right);
  if (leftDefinition || rightDefinition) {
    return Boolean(
      leftDefinition &&
        rightDefinition &&
        leftDefinition.id === rightDefinition.id
    );
  }
  return normalizeDiagnosisLabel(left) === normalizeDiagnosisLabel(right);
}
