// Ported from misiahmiles-ui/leanmaster-note-engine@ef76ca0735ed841e82fa98eed48420724709468b
// Original: src/server/note/planProposition.ts. Only module import paths are adapted.
export type PlanActionDomain =
  | "routine_therapeutic"
  | "external_operational"
  | "treatment_structure"
  | "time_bound_commitment"
  | "measurable_outcome"
  | "unclear_professional_commitment"
  | "none";

export type PlanPropositionKind =
  | "not_prospective_plan"
  | "client_action"
  | "routine_professional_plan"
  | "professional_recommendation"
  | "consequential_professional_commitment"
  | "specific_client_outcome";

export type PlanPropositionClassification = {
  kind: PlanPropositionKind;
  domain: PlanActionDomain;
  planSection: boolean;
  prospective: boolean;
  professionalActor: boolean;
  clientActor: boolean;
  recommendation: boolean;
};

type PlanAuthoritySource = {
  sourceType?: string;
  sourceField?: string;
  matchingText?: string;
  exactText?: string;
};

const professionalActor = /\b(?:clinician|professional|staff|therapist|counselor|social\s+worker|case\s+manager|nurse)\b/i;
const clientActor = /\b(?:client|member|patient|participant)\b/i;
const prospective = /\b(?:will|shall|plan(?:s|ned)?|intend(?:s|ed)?|continue|next\s+(?:session|contact|visit)|future\s+sessions?|follow[- ]?up|goal|objective|may|should|consider)\b/i;
const recommendation = /\b(?:may|might|could|should|consider|recommend(?:ed|ation)?|if\s+clinically\s+indicated|as\s+clinically\s+indicated)\b/i;
const bindingFuture = /\b(?:will|shall|is\s+going\s+to|commits?\s+to|plans?\s+to)\b/i;

const routineTherapeuticAction = /\b(?:monitor|review|reinforce|continue|explore|support|revisit|assess\s+progress|provide\s+(?:routine\s+)?(?:psychoeducation|supportive\s+counseling)|encourage|practice|discuss|address|focus\s+on|help|promote)\b/i;
const externalOperationalAction = /\b(?:contact|call|telephone|notify|refer|make\s+(?:a\s+)?referral|coordinate|send\s+(?:the\s+)?records?|transmit\s+(?:the\s+)?records?|release\s+(?:the\s+)?records?|schedule|arrange)\b[^.!?]{0,120}\b(?:psychiatr(?:ist|ic)|prescriber|pcp|primary\s+care|provider|physician|family|mother|father|guardian|agency|school|hospital|clinic|outside|external)\b|\b(?:refer|make\s+(?:a\s+)?referral|notify\s+(?:an?\s+)?agency|send\s+(?:the\s+)?records?)\b/i;
const professionalExternalCommitment = /\b(?:clinician|professional|staff|therapist|counselor|social\s+worker|case\s+manager|nurse)\s+(?:will|shall|plans?\s+to|is\s+going\s+to)\s+(?:contact|call|telephone|notify|refer|make\s+(?:a\s+)?referral|coordinate|send\s+(?:the\s+)?records?|transmit\s+(?:the\s+)?records?|release\s+(?:the\s+)?records?|schedule|arrange)\b/i;
const treatmentStructureAction = /\b(?:increase|decrease|change|modify|move|switch)\b[^.!?]{0,80}\b(?:session|visit|contact|treatment)\s+(?:frequency|schedule)|\b(?:twice|three\s+times|\d+\s+times)\s+(?:a|per)\s+week\b/i;
const timeBoundCommitment = /\b(?:today|tomorrow|within\s+\d+\s+(?:hours?|days?|weeks?|months?)|by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?))\b/i;
const frequencySpecificity = /\b(?:once|twice|three\s+times|\d+\s+times?)\s+(?:(?:a|per)\s+)?week(?:ly)?\b/i;
const measurableOutcome = /\b(?:client|member|patient|participant)\s+will\s+(?:achieve|decrease|improve|increase|maintain|eliminate|reduce)\b/i;
const measurableSpecificity = /\b(?:within|by|for)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:days?|weeks?|months?|years?|sessions?)\b|\b\d+(?:\.\d+)?\s*%\b/i;

const completedProfessionalAction = /\b(?:clinician|professional|staff|therapist|counselor|social\s+worker|case\s+manager|nurse)\s+(?:has\s+|had\s+)?(?:contacted|called|telephoned|notified|referred|coordinated|sent|transmitted|released|scheduled|arranged|increased|decreased|changed|modified|provided|reviewed|monitored|reinforced|continued|explored|supported|encouraged|completed|performed|conducted|administered|implemented|followed\s+up)\b/i;
const plannedSource = /\b(?:will|shall|plan(?:s|ned)?|intend(?:s|ed)?|next\s+(?:session|contact|visit)|future\s+sessions?|follow[- ]?up|may|should|consider)\b/i;
const clientCommitment = /\b(?:client|member|patient|participant)\s+(?:agreed|consented|committed|plans?|will|intends?)\b/i;

function normalized(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function materialTokens(value: string) {
  const ignored = new Set("a an and as at be by clinician client contact continue for from in is it may member of on or patient participant professional staff that the their them they this to was were will with".split(" "));
  return new Set(normalized(value).split(" ").filter((token) => token.length > 2 && !ignored.has(token)));
}

function sharedMaterialTokens(left: string, right: string) {
  const leftTokens = materialTokens(left);
  const rightTokens = materialTokens(right);
  let shared = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) shared += 1;
  return shared;
}

function canonicalAction(value: string) {
  const action = value.toLowerCase();
  if (action.startsWith("monitor")) return "monitor";
  if (action.startsWith("review")) return "review";
  if (action.startsWith("reinforc")) return "reinforce";
  if (action.startsWith("contact")) return "contact";
  if (action.startsWith("call") || action.startsWith("telephon")) return "call";
  if (action.startsWith("notif")) return "notify";
  if (action.startsWith("refer")) return "refer";
  if (action.startsWith("coordinat")) return "coordinate";
  if (action.startsWith("schedul")) return "schedule";
  if (action.startsWith("arrang")) return "arrange";
  if (action.startsWith("increas")) return "increase";
  if (action.startsWith("decreas")) return "decrease";
  if (action.startsWith("chang")) return "change";
  if (action.startsWith("modif")) return "modify";
  if (action.startsWith("provid")) return "provide";
  if (action.startsWith("encourag")) return "encourage";
  if (action.startsWith("support")) return "support";
  return action;
}

const planActionVerb = /\b(?:monitor(?:ing)?|review(?:ing)?|reinforc(?:e|es|ed|ing)|contact(?:ing)?|call(?:ing)?|telephon(?:e|es|ed|ing)|notif(?:y|ies|ied|ying)|refer(?:ring)?|coordinat(?:e|es|ed|ing)|schedul(?:e|es|ed|ing)|arrang(?:e|es|ed|ing)|increas(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|chang(?:e|es|ed|ing)|modif(?:y|ies|ied|ying)|provid(?:e|es|ed|ing)|encourag(?:e|es|ed|ing)|support(?:s|ed|ing)?)\b/gi;

function clientActionCandidates(value: string) {
  const commitment = value.match(clientCommitment);
  if (!commitment || commitment.index === undefined) return new Set<string>();
  const actionText = value.slice(commitment.index + commitment[0].length);
  return new Set(
    Array.from(actionText.matchAll(planActionVerb), (match) => canonicalAction(match[0]))
  );
}

function leadingProfessionalAction(value: string) {
  const match = value.match(/\b(?:clinician|professional|staff|therapist|counselor|social\s+worker|case\s+manager|nurse)\s+(?:will|shall|plans?\s+to|is\s+going\s+to)\s+(?:continue\s+to\s+)?([a-z]+)/i);
  return match ? canonicalAction(match[1]) : null;
}

function leadingClientAction(value: string) {
  const match = value.match(/\b(?:client|member|patient|participant)\s+(?:agreed|consented|committed|plans?|will|intends?)(?:\s+to)?\s+(?:continue\s+)?([a-z]+)/i);
  return match ? canonicalAction(match[1]) : null;
}

export function isPlanLikeSection(sectionKey: string, sectionLabel = "") {
  return /\b(?:plan|interventions?|objectives?|goals?|recommendations?|follow[- ]?up)\b/i.test(`${sectionKey} ${sectionLabel}`);
}

export function classifyPlanProposition(
  text: string,
  sectionKey: string,
  sectionLabel = ""
): PlanPropositionClassification {
  const planSection = isPlanLikeSection(sectionKey, sectionLabel);
  const isProspective = prospective.test(text);
  const hasProfessionalActor = professionalActor.test(text);
  const hasClientActor = clientActor.test(text);
  const isRecommendation = recommendation.test(text) && !bindingFuture.test(text);

  if (measurableOutcome.test(text) && (measurableSpecificity.test(text) || /\blong[- ]?term\b/i.test(`${sectionKey} ${sectionLabel}`))) {
    return { kind: "specific_client_outcome", domain: "measurable_outcome", planSection, prospective: true, professionalActor: false, clientActor: true, recommendation: false };
  }
  if (!planSection || !isProspective) {
    return { kind: "not_prospective_plan", domain: "none", planSection, prospective: isProspective, professionalActor: hasProfessionalActor, clientActor: hasClientActor, recommendation: isRecommendation };
  }
  if (hasClientActor && !hasProfessionalActor) {
    return { kind: "client_action", domain: "none", planSection, prospective: true, professionalActor: false, clientActor: true, recommendation: isRecommendation };
  }

  let domain: PlanActionDomain = "none";
  if ((hasProfessionalActor && professionalExternalCommitment.test(text)) || (!hasProfessionalActor && externalOperationalAction.test(text))) domain = "external_operational";
  else if (treatmentStructureAction.test(text)) domain = "treatment_structure";
  else if (timeBoundCommitment.test(text) && hasProfessionalActor) domain = "time_bound_commitment";
  else if (routineTherapeuticAction.test(text)) domain = "routine_therapeutic";
  else if (hasProfessionalActor && bindingFuture.test(text)) domain = "unclear_professional_commitment";

  if (isRecommendation) {
    return { kind: "professional_recommendation", domain, planSection, prospective: true, professionalActor: hasProfessionalActor, clientActor: hasClientActor, recommendation: true };
  }
  if (domain === "external_operational" || domain === "treatment_structure" || domain === "time_bound_commitment" || domain === "unclear_professional_commitment") {
    return { kind: "consequential_professional_commitment", domain, planSection, prospective: true, professionalActor: hasProfessionalActor, clientActor: hasClientActor, recommendation: false };
  }
  return { kind: "routine_professional_plan", domain: domain === "none" ? "routine_therapeutic" : domain, planSection, prospective: true, professionalActor: hasProfessionalActor, clientActor: hasClientActor, recommendation: isRecommendation };
}

export function hasExplicitConsequentialAuthorization(
  proposition: string,
  sources: PlanAuthoritySource[]
) {
  return sources.some((source) => {
    const authority = source.matchingText || source.exactText || "";
    const enteredPlan = source.sourceField === "followUpPlan";
    const selectedAction = source.sourceType === "selected_intervention" || source.sourceField?.startsWith("interventionGuidanceContract.selectedActions.");
    if (!enteredPlan && !selectedAction) return false;
    const authorityClass = classifyPlanProposition(authority, "plan", "Plan");
    if (authorityClass.kind !== "consequential_professional_commitment") return false;
    const propositionClass = classifyPlanProposition(proposition, "plan", "Plan");
    if (authorityClass.domain !== propositionClass.domain) return false;
    const propositionAction = leadingProfessionalAction(proposition);
    const authorityAction = leadingProfessionalAction(authority);
    if (propositionAction && authorityAction && propositionAction !== authorityAction) return false;
    const propositionDeadline = proposition.match(timeBoundCommitment)?.[0];
    const authorityDeadline = authority.match(timeBoundCommitment)?.[0];
    if (propositionDeadline && normalized(propositionDeadline) !== normalized(authorityDeadline || "")) return false;
    const propositionFrequency = proposition.match(frequencySpecificity)?.[0];
    const authorityFrequency = authority.match(frequencySpecificity)?.[0];
    if (propositionFrequency && normalized(propositionFrequency) !== normalized(authorityFrequency || "")) return false;
    return sharedMaterialTokens(proposition, authority) >= 1;
  });
}

export function plannedSourceCannotProveCompletion(
  proposition: string,
  sources: PlanAuthoritySource[]
) {
  if (!completedProfessionalAction.test(proposition)) return false;
  const relevant = sources.filter((source) => sharedMaterialTokens(proposition, source.matchingText || source.exactText || "") > 0);
  return relevant.length > 0 && relevant.every((source) => {
    const authority = source.matchingText || source.exactText || "";
    return source.sourceField === "followUpPlan" || source.sourceType === "selected_intervention" || source.sourceType === "clinical_library" || plannedSource.test(authority);
  });
}

export function clientActionReassignedToProfessional(
  proposition: string,
  sources: PlanAuthoritySource[]
) {
  if (!professionalActor.test(proposition) || !prospective.test(proposition)) return false;
  const clientSources = sources.filter((source) => clientCommitment.test(source.matchingText || source.exactText || ""));
  if (!clientSources.length) return false;
  const propositionAction = leadingProfessionalAction(proposition);
  if (!propositionAction) return false;
  const matchingClientAction = clientSources.some((source) =>
    leadingClientAction(source.matchingText || source.exactText || "") === propositionAction ||
    clientActionCandidates(source.matchingText || source.exactText || "").has(propositionAction)
  );
  if (!matchingClientAction) return false;
  const classification = classifyPlanProposition(proposition, "Plan", "Plan");
  if (classification.kind === "consequential_professional_commitment") {
    const matchingProfessionalAuthorization = sources.some((source) => {
      const authority = source.matchingText || source.exactText || "";
      const authorizedSource = source.sourceField === "followUpPlan" || source.sourceType === "selected_intervention";
      return authorizedSource && leadingProfessionalAction(authority) === propositionAction;
    });
    return !matchingProfessionalAuthorization;
  }
  const clientActionIsOnlyAuthority = sources.every((source) =>
    clientCommitment.test(source.matchingText || source.exactText || "")
  );
  return clientActionIsOnlyAuthority;
}
