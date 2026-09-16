import type { PsychosocialJurisdiction } from "@/types/intake";

export type FieldGuidance = {
  ask: string;
  document: string;
  caution?: string;
};

const exact = (
  ask: string,
  document: string,
  caution?: string
): FieldGuidance => ({ ask, document, caution });

const FIELD_GUIDANCE: Record<string, FieldGuidance> = {
  "identifying.primaryLanguage": exact(
    "What language does the participant prefer for speaking, reading, and receiving care information?",
    "The participant's stated preferred language and any communication format needed."
  ),
  "identifying.interpreterNeeded": exact(
    "Does the participant need a qualified interpreter to communicate effectively?",
    "Select Yes, No, or Unknown based on information actually obtained.",
    "Do not convert Unknown into No."
  ),
  "identifying.guardianProxyOnFile": exact(
    "Is there current guardian or health-care proxy documentation in the agency record?",
    "Select Yes, No, or Unknown based on the documentation available.",
    "Do not infer legal authority from family involvement alone."
  ),
  "living.currentResidence": exact(
    "Where does the participant currently live, and what type of setting is it?",
    "Residence type and clinically relevant accessibility or support features; keep contact details in the identifying fields."
  ),
  "living.livesWith": exact(
    "Who lives in the home with the participant, and what support do they provide?",
    "Household relationships and support roles. Names are not necessary here."
  ),
  "living.stairsInside": exact(
    "How many interior stairs must the participant use in daily routines?",
    "The reported number of stairs; leave blank if not obtained rather than estimating."
  ),
  "living.stairsOutside": exact(
    "How many exterior steps are required to enter or leave the home?",
    "The reported number of exterior steps; leave blank if not obtained rather than estimating."
  ),
  "living.elevatorAccess": exact(
    "Is a working elevator available when the participant must change floors?",
    "Select Yes, No, or Unknown based on the actual residence and route used.",
    "Unknown is not the same as No."
  ),
  "living.primaryCaregiver": exact(
    "Who provides the participant's primary unpaid or family support, and what is their relationship?",
    "Caregiver role, relationship, and relevant involvement. The name remains local and is removed from the AI copy."
  ),
  "living.caregiverStressNoted": exact(
    "Has the caregiver described strain, overload, or difficulty sustaining the current support?",
    "Select Yes, No, or Unknown and attribute the information to the caregiver, participant, records, or observation when known.",
    "Do not infer caregiver strain from the amount of help provided alone."
  ),
  "living.transportation": exact(
    "How will the participant travel to and from the center, and is assistance required?",
    "Transportation source, reliability, supervision, mobility accommodation, and documented barriers."
  ),
  "functional.orientation": exact(
    "How is the participant oriented to person, place, time, and situation in usual functioning?",
    "Reported or observed orientation, the source, and whether the finding is current or fluctuating.",
    "Do not turn a brief observation or screen into a diagnosis."
  ),
  "functional.memoryConcerns": exact(
    "What memory changes or concerns have been noticed, by whom, and how do they affect daily life?",
    "Specific current or historical concerns, functional effect, source, and supports already used.",
    "Distinguish participant report, caregiver report, records, and clinician observation."
  ),
  "functional.decisionMaking": exact(
    "How does the participant make everyday choices, and when is support helpful?",
    "Observed or reported decision-making supports and functional impact.",
    "Do not document legal incapacity unless it is established in the source record."
  ),
  "functional.ambulation": exact(
    "How does the participant usually move around at home and in the community?",
    "Usual mobility method, assistance level, device use, endurance, and documented limitations."
  ),
  "functional.transfers": exact(
    "What help is needed to move between bed, chair, toilet, or vehicle?",
    "Usual transfer ability, assistance level, equipment, and safety concerns."
  ),
  "functional.adlHelp": exact(
    "Which daily activities require setup, cueing, supervision, or hands-on assistance?",
    "Activity, level of help, source of help, and current functional effect."
  ),
  "functional.recentFalls": exact(
    "Has the participant fallen or nearly fallen in the last six months? What happened and when?",
    "Reported falls or near falls, approximate timing, injury, circumstances, and current precautions.",
    "A past fall is not automatically a current fall risk; preserve the time frame."
  ),
  "communication.primaryCommunication": exact(
    "How does the participant usually communicate needs and preferences?",
    "Primary method, such as speech, gestures, writing, communication device, or supported communication."
  ),
  "communication.hearingStatus": exact(
    "How well does the participant hear conversation in typical settings?",
    "Current functional hearing, reported barriers, and helpful accommodations."
  ),
  "communication.hearingAids": exact(
    "Does the participant currently use hearing aids?",
    "Select Yes, No, or Unknown based on information actually obtained.",
    "Do not convert Unknown into No."
  ),
  "communication.visionStatus": exact(
    "How well does the participant see for daily activities?",
    "Current functional vision, reported barriers, and helpful accommodations."
  ),
  "communication.glasses": exact(
    "Does the participant currently use glasses or other prescribed visual aids?",
    "Select Yes, No, or Unknown based on information actually obtained."
  ),
  "communication.communicationNeeds": exact(
    "What makes communication easier or harder for the participant?",
    "Identified barrier, functional effect, current accommodation, and additional documented support need."
  ),
  "psychosocial.baselineMood": exact(
    "How does the participant describe their usual mood, and has it changed recently?",
    "Usual mood, current change, duration when known, and the information source.",
    "Do not infer a mental-health diagnosis from mood description alone."
  ),
  "psychosocial.mentalHealthHistory": exact(
    "Has the participant had past or current mental-health concerns, treatment, or diagnoses?",
    "Documented diagnoses separately from reported symptoms, with current versus historical status and source.",
    "Symptoms or screening findings are not diagnoses."
  ),
  "psychosocial.currentStressors": exact(
    "What is causing the participant the most stress right now?",
    "Current stressors, functional effect, source, and relevant supports without unnecessary identifying detail."
  ),
  "psychosocial.strengthsCoping": exact(
    "What helps the participant manage difficult situations, and what personal strengths do they identify?",
    "Participant-identified strengths, coping strategies, interests, relationships, and protective factors."
  ),
  "psychosocial.socialEngagement": exact(
    "How does the participant spend time with other people, and are they satisfied with that level of contact?",
    "Current social participation, preferences, isolation concerns, and barriers."
  ),
  "psychosocial.thoughtBehaviorConcerns": exact(
    "Have there been changes or concerns involving thoughts, perceptions, behavior, or emotional regulation?",
    "Specific reported or observed behavior, frequency, context, effect, source, and current versus historical status.",
    "Use objective language and do not infer a diagnosis or intent."
  ),
  "medicalHistory.majorMedicalDiagnoses": exact(
    "Which documented medical conditions affect daily functioning or participation?",
    "Diagnoses documented by a qualified source and their psychosocial or functional relevance.",
    "Do not add a diagnosis based only on symptoms or medications."
  ),
  "medicalHistory.psychiatricDiagnoses": exact(
    "Which psychiatric diagnoses are documented, and are they current or historical?",
    "Documented diagnosis, source, and status. Record unconfirmed reports as reports rather than established diagnoses.",
    "Screening findings and symptoms are not diagnoses."
  ),
  "medicalHistory.currentMedications": exact(
    "Which current medications are psychosocially or functionally relevant?",
    "Current medication information from the available source and relevant adherence, supervision, or side-effect considerations."
  ),
  "medicalHistory.allergies": exact(
    "Are any allergies or medication intolerances documented?",
    "Substance or medication and the documented reaction when known; preserve Unknown when not obtained."
  ),
  "medicalHistory.psychiatricHospitalization": exact(
    "Has the participant ever had a psychiatric hospitalization?",
    "Select Yes, No, or Unknown based on the information actually obtained.",
    "Historical hospitalization is not a current hospitalization."
  ),
  "medicalHistory.psychiatricHospitalizationDetails": exact(
    "What is known about the approximate timing, reason, and outcome of prior psychiatric hospitalization?",
    "Clinically relevant approximate timing and reason without unnecessary facility or person identifiers.",
    "Preserve historical status and source attribution."
  ),
  "medicalHistory.suicideSelfHarmHistory": exact(
    "Has the participant ever had suicidal thoughts, suicide attempts, or self-harm behavior?",
    "Select Yes, No, or Unknown exactly as obtained, and use the risk-details field for timing, source, and current status.",
    "Do not convert Unknown into No or historical risk into current risk."
  ),
  "medicalHistory.currentRiskDetails": exact(
    "Are there current suicidal, self-harm, homicidal, or other immediate safety concerns?",
    "Exact current status, participant statements, timing, plan or intent if assessed, protective factors, source, and action taken.",
    "Denied, Unknown, and Not assessed have different meanings. Follow agency emergency procedures for urgent risk."
  ),
  "medicalHistory.substanceUseHistory": exact(
    "What past or current substance use is clinically relevant, and what is the participant's view of it?",
    "Substance, current versus historical pattern, reported effect, recovery supports, and source.",
    "Do not infer a substance-use disorder."
  ),
  "medicalHistory.alcoholUse": exact(
    "What alcohol use, if any, is reported currently and historically?",
    "Reported amount, frequency, time frame, effect, and source; preserve denied, unknown, or not assessed."
  ),
  "medicalHistory.drugUse": exact(
    "What non-prescribed or other drug use, if any, is reported currently and historically?",
    "Reported substance, pattern, time frame, effect, and source; preserve denied, unknown, or not assessed."
  ),
  "medicalHistory.otherHistory": exact(
    "Is there other history that materially affects psychosocial functioning, safety, or service planning?",
    "Only relevant facts, their source, and current versus historical status."
  ),
  "conditions.medicationManagement": exact(
    "Who organizes, administers, and monitors medications?",
    "Current level of independence or assistance, caregiver role, tools used, and source."
  ),
  "conditions.medicationAdherenceConcerns": exact(
    "Have doses been missed, duplicated, refused, or taken unsafely?",
    "Specific concern, frequency, timing, source, functional effect, and current safeguards.",
    "Concern is not the same as a confirmed event."
  ),
  "conditions.appetite": exact(
    "How has the participant's appetite been recently compared with usual?",
    "Current pattern, change from baseline, duration, and source."
  ),
  "conditions.specialDiet": exact(
    "Is a special diet prescribed or preferred, and what support is needed to follow it?",
    "Documented diet, reason if known, preferences, and practical support needs."
  ),
  "conditions.recentWeightChange": exact(
    "Has there been a recent unplanned weight gain or loss?",
    "Direction, approximate amount and time frame if known, source, and documented follow-up."
  ),
  "conditions.oralDentalStatus": exact(
    "Are pain, chewing, swallowing, denture, or access-to-care concerns affecting eating or participation?",
    "Current functional concern, source, supports, and documented follow-up."
  ),
  "conditions.skinCondition": exact(
    "Are there documented skin concerns that affect comfort, mobility, safety, or care needs?",
    "Current documented concern, functional effect, source, and care coordination need.",
    "Do not diagnose a skin condition from observation alone."
  ),
  "safety.assistiveDevices": exact(
    "Which devices does the participant use, and when is help needed to use them safely?",
    "Device, usual setting, independence or assistance, fit or availability concern, and source."
  ),
  "safety.specialTreatments": exact(
    "Are special treatments relevant to daily participation or supervision?",
    "Documented treatment, schedule or support need, source, and current status."
  ),
  "safety.harmRisk": exact(
    "Is there current or historical risk of harm to self or others?",
    "Exact reported or observed status, timing, source, triggers, protective factors, and current precautions.",
    "Do not convert denied, unknown, not assessed, historical, or concern into a current confirmed risk."
  ),
  "safety.abuseNeglectConcerns": exact(
    "Are there concerns or disclosures involving abuse, neglect, or exploitation?",
    "Exact concern or disclosure, current versus historical status, source, observable facts, and action taken under agency policy.",
    "Do not label a concern as confirmed unless the source supports that status."
  ),
  "safety.elopementRisk": exact(
    "Has the participant wandered, become lost, or attempted to leave supervision unexpectedly?",
    "Current or historical episodes, frequency, triggers, source, and safeguards.",
    "No known episode, Unknown, and Not assessed are different findings."
  ),
  "safety.safetyPrecautions": exact(
    "What precautions are currently used, who implements them, and what risk do they address?",
    "Specific current precaution, responsible support, setting, and documented rationale."
  ),
  "goals.participantFamilyGoals": exact(
    "What would the participant like to maintain, improve, or receive help with while attending the program?",
    "The participant's own stated goals when possible, with family goals clearly attributed separately."
  ),
  "goals.socialWorkServicesNeeded": exact(
    "What social-work support is requested or indicated by the documented needs?",
    "Specific need, requested support, barrier, urgency, and source."
  ),
  "goals.servicePriorities": exact(
    "Which documented needs should the plan of care address first?",
    "Prioritized, participant-centered services tied to actual intake findings.",
    "Do not add services that are unsupported by the assessment."
  ),
  "homeVisit.livingArrangements": exact(
    "How is the home arranged for the participant's daily routines and support needs?",
    "Observed and reported living arrangement, accessibility, and support implications. Distinguish observation from report."
  ),
  "homeVisit.householdComposition": exact(
    "Who lives in the home and what support roles do they have?",
    "Relationships, presence, and support roles without unnecessary names."
  ),
  "homeVisit.closestRelative": exact(
    "Which relationship is the participant's closest available family support?",
    "Relationship and support role; the person's name can remain in the local intake but is excluded from AI facts."
  ),
  "homeVisit.frequencyOfVisits": exact(
    "How often do supportive relatives or others visit or make contact?",
    "Reported frequency, type of contact, and practical support provided."
  ),
  "homeVisit.groupCommunitySupports": exact(
    "What community, faith, cultural, or peer supports does the participant use or value?",
    "Current support type, frequency, preference, and access barriers."
  ),
  "homeVisit.shoppingAvailability": exact(
    "How are groceries and essential items obtained?",
    "Current shopping access, assistance, reliability, and barriers."
  ),
  "homeVisit.publicTransportation": exact(
    "Is usable public or community transportation available to the participant?",
    "Availability, accessibility, ability to use it safely, and reported barriers."
  ),
  "homeVisit.structuralEnvironment": exact(
    "What structural features affect safe entry, movement, and daily activities?",
    "Objective observations about access, stairs, lighting, layout, and mobility barriers."
  ),
  "homeVisit.entrance": exact(
    "Is the entrance accessible for the participant's usual mobility method?",
    "Observed steps, rails, surface, width, lighting, and barriers relevant to the existing question."
  ),
  "homeVisit.livingRoom": exact(
    "Can the participant move and use seating safely in the living area?",
    "Observed layout, pathways, seating, lighting, and mobility barriers."
  ),
  "homeVisit.kitchen": exact(
    "Can the participant safely access food, water, and needed kitchen items?",
    "Observed accessibility, hazards, and assistance needs relevant to daily use."
  ),
  "homeVisit.bathroom": exact(
    "What supports or barriers affect safe bathroom use?",
    "Observed access, transfer space, grab supports, surfaces, and assistance needs."
  ),
  "homeVisit.bedroom": exact(
    "Can the participant access and use the sleeping area safely?",
    "Observed access, transfer space, lighting, pathways, and relevant barriers."
  ),
  "homeVisit.roomsOneLevel": exact(
    "Are the rooms needed for daily living available on one level?",
    "Select Yes, No, or Unknown from observation or reliable report and note relevant barriers elsewhere."
  ),
  "homeVisit.telephones": exact(
    "Can the participant reach and use a telephone or alert device when needed?",
    "Availability, accessibility, ability to use it, and needed assistance."
  ),
  "homeVisit.roomAppearance": exact(
    "Do room conditions create functional or safety concerns?",
    "Objective observations about pathways, sanitation, lighting, clutter, or access without judgmental language."
  ),
  "homeVisit.carpeting": exact(
    "Does carpeting or flooring affect mobility or fall safety?",
    "Observed surface condition and any functional barrier or hazard."
  ),
  "homeVisit.safetyHazards": exact(
    "Which listed hazards are directly observed or reliably reported?",
    "Select only supported findings; use Other and comments for a specific unlisted hazard.",
    "Do not treat an unchecked item as a clinical denial unless it was assessed."
  ),
  "homeVisit.otherSafetyHazard": exact(
    "What other specific environmental hazard was observed or reported?",
    "Objective description, location in the home, source, and functional or safety effect."
  ),
  "homeVisit.comments": exact(
    "What additional home-visit information materially affects support or safety planning?",
    "Relevant observations, participant or caregiver report, source, and follow-up without repeating identifiers."
  ),
  "consents.transportation.canBeLeftUnsupervised": exact(
    "Has the participant or legal representative explicitly authorized an unsupervised drop-off under agency policy?",
    "Select the documented authorization response exactly; do not infer it from functional status."
  ),
  "initialDischarge.clientStatus": exact(
    "Which listed status descriptions are supported at this initial assessment?",
    "Select only statuses actually assessed or documented."
  ),
  "initialDischarge.socialization": exact(
    "How would the participant's current socialization level be described based on the available source?",
    "Select the supported level and preserve whether it is reported or observed."
  ),
  "initialDischarge.participation": exact(
    "Which program activities is the participant expected or interested to participate in?",
    "Supported expectations and participant preferences; add barriers or conditions in notes."
  ),
  "initialDischarge.participationNotes": exact(
    "What preferences, barriers, accommodations, or source details affect participation?",
    "Participant-centered details tied to the selected participation items."
  ),
  "initialDischarge.livingAdls": exact(
    "Which living arrangement and ADL support descriptions apply now?",
    "Select only supported current findings and document assistance level accurately."
  ),
  "initialDischarge.levelOfServiceAppropriate": exact(
    "Does the documented assessment support the proposed level of service?",
    "Select the professional determination and document unresolved information or referral needs in the related notes.",
    "Do not use the cognitive screen alone to determine eligibility or level of care."
  ),
  "initialDischarge.mobility": exact(
    "Which option best describes the participant's usual current mobility?",
    "Select the supported status and use notes for device, assistance, setting, or variability."
  ),
  "initialDischarge.mobilityNotes": exact(
    "What assistance, device, endurance, or safety detail is needed to understand mobility?",
    "Specific current functional detail and source."
  ),
  "quarterlyDischarge.dischargeSetting": exact(
    "What discharge setting is currently projected based on participant preference and available supports?",
    "The current projection and source; use comments for conditions or uncertainty.",
    "A projection is not a confirmed placement."
  ),
  "quarterlyDischarge.familyCaregiverSpecify": exact(
    "What caregiver relationship or support role is relevant to the projected setting?",
    "Relationship and anticipated support role without an unnecessary name."
  ),
  "quarterlyDischarge.otherSettingSpecify": exact(
    "What other type of setting is being considered?",
    "Setting type and current planning status without facility address or other unnecessary identifiers."
  ),
  "quarterlyDischarge.settingComments": exact(
    "What preferences, barriers, contingencies, or uncertainty affect the projected setting?",
    "Current planning facts, source, and unresolved needs."
  ),
  "quarterlyDischarge.supportiveServices": exact(
    "Which supports may be needed for a safe transition?",
    "Select services tied to documented needs; use comments for timing, status, and barriers."
  ),
  "quarterlyDischarge.otherServiceSpecify": exact(
    "What other supportive service may be needed?",
    "Service type and the documented need it addresses."
  ),
  "quarterlyDischarge.servicesComments": exact(
    "What referral status, access barrier, preference, or coordination detail affects these services?",
    "Current planning detail, source, and unresolved follow-up."
  ),
  "quarterlyDischarge.longTermCareReferralNote": exact(
    "Is a long-term-care referral being considered, requested, made, or completed?",
    "Current referral status, reason, source, and follow-up without unnecessary identifiers."
  )
};

const MARYLAND_GUIDANCE: Record<string, FieldGuidance> = {
  "maryland.homeEnvironmentAssessmentStatus": exact(
    "What is the current completion status of the required home-environment assessment?",
    "Select the documented status; do not infer completion from this intake's home-visit notes."
  ),
  "maryland.significantChangeReassessmentStatus": exact(
    "After a significant change, what is the documented reassessment status?",
    "Select the actual tracking status and keep the significant-change date distinct from the reassessment date."
  ),
  "maryland.planOfCareCoordinationStatus": exact(
    "What is the current status of multidisciplinary plan-of-care coordination?",
    "Select the documented status and use the psychosocial-contribution field for clinically relevant input."
  ),
  "maryland.psychosocialContribution": exact(
    "What psychosocial goals, barriers, referrals, and supports should inform multidisciplinary planning?",
    "Source-grounded social-work contribution, participant priorities, referral status, and follow-up.",
    "Stay within the evaluator's credentials and do not convert screening findings into diagnoses."
  ),
  "maryland.dischargeException": exact(
    "Is a documented emergency or regulatory exception being considered for discharge notice?",
    "The documented exception, source, review status, and rationale under current agency policy.",
    "Do not infer that an exception applies; agency and legal review remain responsible."
  ),
  "maryland.dischargeReason": exact(
    "What is the documented reason for discharge and the currently planned setting?",
    "Reason, participant or representative involvement, planned setting type, and current status without unnecessary identifiers."
  ),
  "maryland.notes": exact(
    "What additional Maryland psychosocial coordination detail materially affects care or discharge planning?",
    "Relevant source-grounded coordination facts, unresolved items, and follow-up."
  )
};

export const MENTAL_STATUS_GUIDANCE = exact(
  "Ask the question as written without supplying the answer. If communication access requires an accommodation, document it in Notes.",
  "Choose Correct, Incorrect, or Unable / refused based on the response. Use Notes for the response, accommodation, source, or reason the item could not be completed.",
  "This is a brief screen only. Do not use it as a diagnosis, capacity finding, incompetence finding, or program-eligibility determination."
);

export const MENTAL_STATUS_ACKNOWLEDGMENT_GUIDANCE = exact(
  "Before checking this acknowledgment, confirm the score and individual responses have been reviewed in clinical context.",
  "The checkbox records acknowledgment of the screening boundary; it does not make the result a diagnosis."
);

export function getFieldGuidance(
  path: string,
  jurisdiction: PsychosocialJurisdiction
) {
  return jurisdiction === "MD" && MARYLAND_GUIDANCE[path]
    ? MARYLAND_GUIDANCE[path]
    : FIELD_GUIDANCE[path];
}

export function getGuidedFieldPaths(jurisdiction: PsychosocialJurisdiction) {
  return new Set([
    ...Object.keys(FIELD_GUIDANCE),
    ...(jurisdiction === "MD" ? Object.keys(MARYLAND_GUIDANCE) : [])
  ]);
}

