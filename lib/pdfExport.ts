import {
  PDFDocument,
  PDFFont,
  PDFForm,
  PDFImage,
  PDFPage,
  rgb,
  StandardFonts
} from "pdf-lib";
import type { FieldDefinition, IntakePacket, IntakeStep } from "@/types/intake";
import { INTAKE_STEPS } from "./sections";
import { BRAND_PLACEHOLDERS, PRODUCT_NAME } from "./placeholders";
import {
  companyFooter,
  companyName,
  formatValue,
  getValueByPath,
  scoreMentalStatus
} from "./packetUtils";

type PdfMode = "draft" | "final";

type PdfContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  form: PDFForm | null;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  mode: PdfMode;
  packet: IntakePacket;
  fieldIndex: number;
  logoImage: PDFImage | null;
};

const pageSize: [number, number] = [612, 792];
const margin = 48;
const contentWidth = pageSize[0] - margin * 2;
const choiceBoxSize = 11;

const mentalStatusOptions = [
  { label: "Correct", value: "correct" },
  { label: "Incorrect", value: "incorrect" },
  { label: "Unable / refused", value: "unable" }
];

export async function buildPacketPdf(
  packet: IntakePacket,
  mode: PdfMode
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await embedLogoImage(pdfDoc, packet.company.logoUrl);

  const context: PdfContext = {
    pdfDoc,
    page: pdfDoc.addPage(pageSize),
    form: mode === "draft" ? pdfDoc.getForm() : null,
    font,
    bold,
    y: pageSize[1] - margin,
    mode,
    packet,
    fieldIndex: 0,
    logoImage
  };

  drawPacketHeader(context);
  drawText(context, PRODUCT_NAME, 22, true, 16);
  drawText(
    context,
    mode === "draft"
      ? "Editable draft psychosocial assessment packet"
      : "Final psychosocial assessment packet",
    12,
    false,
    20
  );
  drawText(
    context,
    "No-retention local PDF export-only workflow. Entered information remains active only in the current browser tab until PDF export, print, clear, refresh, close, or navigation away.",
    10,
    false,
    22
  );

  INTAKE_STEPS.forEach((step) => drawStep(context, step));
  drawPageNumbers(context);
  if (mode === "draft" && context.form) {
    drawDraftWatermark(context);
    context.form.updateFieldAppearances(font);
  }

  return pdfDoc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawStep(context: PdfContext, step: IntakeStep) {
  ensureRoom(context, 86);
  context.y -= 12;
  drawText(context, `${step.eyebrow}: ${step.title}`, 15, true, 8);
  drawText(context, applyBrand(step.description, context.packet), 9, false, 14);

  if (step.custom === "mental-status") {
    drawMentalStatus(context);
    return;
  }

  if (step.fields) {
    drawFields(context, step.fields);
  }

  step.groups?.forEach((group) => {
    ensureRoom(context, 52);
    drawText(context, group.title, 12, true, 6);
    if (group.description) {
      drawText(context, applyBrand(group.description, context.packet), 9, false, 10);
    }
    drawFields(context, group.fields);
  });
}

function drawFields(context: PdfContext, fields: FieldDefinition[]) {
  fields.forEach((field) => {
    const rawValue = getValueByPath(context.packet, field.path);
    drawField(context, field, rawValue);
  });
}

function drawMentalStatus(context: PdfContext) {
  context.packet.mentalStatus.responses.forEach((response, index) => {
    drawField(context, {
      path: `mentalStatus.responses.${index}.status`,
      label: `${index + 1}. ${response.question}`,
      kind: "radio",
      options: mentalStatusOptions,
      full: true
    }, response.status);
    drawField(context, {
      path: `mentalStatus.responses.${index}.notes`,
      label: "Notes",
      kind: "textarea",
      full: true
    }, response.notes);
  });

  const score = scoreMentalStatus(context.packet);
  drawScoringSummary(context, [
    `Total score: ${score.missed} of 10 incorrect / unable-refused`,
    `Screening result: ${score.level}`,
    `Scoring interpretation: ${scoringInterpretation(score.level)}`
  ]);
  drawText(
    context,
    "Screening summary only. This result does not diagnose cognitive impairment, determine capacity, establish New Jersey program eligibility, or replace qualified professional assessment and follow-up.",
    9,
    false,
    10
  );
}

function drawField(
  context: PdfContext,
  field: FieldDefinition,
  rawValue: unknown
) {
  if (field.kind === "logoUpload") {
    drawLogoUploadField(context, rawValue);
    return;
  }

  if (context.mode === "draft" && context.form) {
    if (field.kind === "checkboxGroup") {
      drawCheckboxGroupField(context, field, rawValue);
      return;
    }

    if (field.kind === "checkbox") {
      drawSingleCheckboxField(context, field, rawValue);
      return;
    }

    if (field.kind === "radio") {
      drawRadioField(context, field, rawValue);
      return;
    }
  }

  const value = formatFieldValue(field, rawValue);
  drawFieldLine(context, field, value);
}

function drawLogoUploadField(context: PdfContext, rawValue: unknown) {
  const hasUploadedLogo = typeof rawValue === "string" && rawValue.length > 0;
  const summary = !hasUploadedLogo
    ? "Uploaded logo: Not uploaded"
    : context.logoImage
      ? "Uploaded logo: Included in the packet header and PDF output."
      : "Uploaded logo: Available in browser review and print output. PNG and JPG logos can also be embedded directly in downloaded PDFs.";
  const summaryLines = wrapText(summary, context.font, 8.5, contentWidth - 18);
  const imageBoxHeight = context.logoImage ? 56 : 0;

  ensureRoom(context, 34 + imageBoxHeight + summaryLines.length * 11);
  drawFieldLabel(context, "Upload Company Logo:", context.y);
  context.y -= 20;

  if (context.logoImage) {
    const dimensions = context.logoImage.scaleToFit(112, 48);
    context.page.drawImage(context.logoImage, {
      x: margin + 10,
      y: context.y - dimensions.height + 4,
      width: dimensions.width,
      height: dimensions.height
    });
    context.y -= imageBoxHeight;
  }

  drawSummaryLines(context, summaryLines);
}

function drawCheckboxGroupField(
  context: PdfContext,
  field: FieldDefinition,
  rawValue: unknown
) {
  const selectedValues = Array.isArray(rawValue)
    ? rawValue.map(String)
    : [];
  const selectedLabels = selectedValues.map((value) =>
    optionLabel(field, value)
  );
  const summary = `Selected ${field.label}: ${
    selectedLabels.length ? selectedLabels.join(", ") : "None selected"
  }`;
  const summaryLines = wrapText(summary, context.font, 8.5, contentWidth - 18);
  const options = field.options ?? [];
  const needed = 28 + options.length * 18 + summaryLines.length * 11 + 12;

  ensureRoom(context, needed);
  drawFieldLabel(context, `${field.label}:`, context.y);
  context.y -= 20;

  options.forEach((option) => {
    ensureRoom(context, 40);
    const checkBox = context.form!.createCheckBox(
      toPdfFieldName(`${field.path}.${option.value}`, context)
    );
    checkBox.addToPage(context.page, {
      x: margin + 10,
      y: context.y - 2,
      width: choiceBoxSize,
      height: choiceBoxSize,
      borderColor: rgb(0.56, 0.65, 0.62),
      borderWidth: 0.7,
      backgroundColor: rgb(1, 1, 1)
    });
    if (selectedValues.includes(option.value)) {
      checkBox.check();
    }
    context.page.drawText(option.label, {
      x: margin + 28,
      y: context.y,
      size: 8.5,
      font: context.font,
      color: rgb(0.18, 0.25, 0.23)
    });
    context.y -= 18;
  });

  drawSummaryLines(context, summaryLines);
}

function drawSingleCheckboxField(
  context: PdfContext,
  field: FieldDefinition,
  rawValue: unknown
) {
  const isChecked = rawValue === true;
  const summary = `Selected ${field.label}: ${isChecked ? "Yes" : "Not selected"}`;
  const summaryLines = wrapText(summary, context.font, 8.5, contentWidth - 18);

  ensureRoom(context, 58 + summaryLines.length * 11);
  drawFieldLabel(context, `${field.label}:`, context.y);
  const checkBox = context.form!.createCheckBox(toPdfFieldName(field.path, context));
  checkBox.addToPage(context.page, {
    x: margin + 10,
    y: context.y - 24,
    width: choiceBoxSize,
    height: choiceBoxSize,
    borderColor: rgb(0.56, 0.65, 0.62),
    borderWidth: 0.7,
    backgroundColor: rgb(1, 1, 1)
  });
  if (isChecked) {
    checkBox.check();
  }
  context.page.drawText(isChecked ? "Checked" : "Not selected", {
    x: margin + 28,
    y: context.y - 22,
    size: 8.5,
    font: context.font,
    color: rgb(0.18, 0.25, 0.23)
  });
  context.y -= 42;
  drawSummaryLines(context, summaryLines);
}

function drawRadioField(
  context: PdfContext,
  field: FieldDefinition,
  rawValue: unknown
) {
  const selectedValue = typeof rawValue === "string" ? rawValue : "";
  const selectedLabel = selectedValue
    ? optionLabel(field, selectedValue)
    : "Not selected";
  const summary = `Selected ${field.label}: ${selectedLabel}`;
  const summaryLines = wrapText(summary, context.font, 8.5, contentWidth - 18);
  const options = field.options ?? [];
  const needed = 28 + options.length * 18 + summaryLines.length * 11 + 12;

  ensureRoom(context, needed);
  drawFieldLabel(context, `${field.label}:`, context.y);
  context.y -= 20;

  const radioGroup = context.form!.createRadioGroup(
    toPdfFieldName(field.path, context)
  );
  radioGroup.disableOffToggling();

  options.forEach((option) => {
    ensureRoom(context, 40);
    radioGroup.addOptionToPage(option.value, context.page, {
      x: margin + 10,
      y: context.y - 2,
      width: choiceBoxSize,
      height: choiceBoxSize,
      borderColor: rgb(0.56, 0.65, 0.62),
      borderWidth: 0.7,
      backgroundColor: rgb(1, 1, 1)
    });
    context.page.drawText(option.label, {
      x: margin + 28,
      y: context.y,
      size: 8.5,
      font: context.font,
      color: rgb(0.18, 0.25, 0.23)
    });
    context.y -= 18;
  });

  if (selectedValue && options.some((option) => option.value === selectedValue)) {
    radioGroup.select(selectedValue);
  }

  drawSummaryLines(context, summaryLines);
}

function drawScoringSummary(context: PdfContext, lines: string[]) {
  const wrappedLines = lines.flatMap((line) =>
    wrapText(line, context.font, 9, contentWidth - 16)
  );
  ensureRoom(context, wrappedLines.length * 13 + 22);
  context.page.drawRectangle({
    x: margin,
    y: context.y - wrappedLines.length * 13 - 8,
    width: contentWidth,
    height: wrappedLines.length * 13 + 18,
    color: rgb(0.87, 0.97, 0.94),
    borderColor: rgb(0.67, 0.83, 0.78),
    borderWidth: 0.6
  });
  wrappedLines.forEach((line, index) => {
    context.page.drawText(line, {
      x: margin + 8,
      y: context.y - index * 13,
      size: 9,
      font: index === 0 ? context.bold : context.font,
      color: rgb(0.11, 0.16, 0.15)
    });
  });
  context.y -= wrappedLines.length * 13 + 22;
}

function drawSummaryLines(context: PdfContext, lines: string[]) {
  ensureRoom(context, lines.length * 11 + 8);
  lines.forEach((line) => {
    context.page.drawText(line, {
      x: margin + 10,
      y: context.y,
      size: 8.5,
      font: context.bold,
      color: rgb(0.36, 0.24, 0.18)
    });
    context.y -= 11;
  });
  context.y -= 8;
}

function drawFieldLabel(context: PdfContext, label: string, y: number) {
  context.page.drawText(label, {
    x: margin,
    y,
    size: 9,
    font: context.bold,
    color: rgb(0.11, 0.16, 0.15)
  });
}

function formatFieldValue(field: FieldDefinition, rawValue: unknown) {
  if (field.kind === "radio" && typeof rawValue === "string") {
    return rawValue ? optionLabel(field, rawValue) : "";
  }

  if (field.kind === "checkboxGroup" && Array.isArray(rawValue)) {
    return rawValue.map((value) => optionLabel(field, String(value))).join(", ");
  }

  return formatValue(rawValue, "");
}

function optionLabel(field: FieldDefinition, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function scoringInterpretation(level: string) {
  if (level === "No or minimal screening concern") {
    return "No or minimal errors identified on this screening based on selected responses.";
  }

  return `${level} based on selected responses; qualified professional review is required.`;
}

function drawFieldLine(
  context: PdfContext,
  field: FieldDefinition,
  value: string
) {
  const labelText = `${field.label}:`;
  const naturalLabelWidth = context.bold.widthOfTextAtSize(labelText, 9) + 8;
  const shouldStack = Boolean(field.full) || naturalLabelWidth > 185;
  const labelWidth = Math.min(naturalLabelWidth, 190);
  const fieldX = shouldStack ? margin : margin + labelWidth;
  const fieldWidth = shouldStack ? contentWidth : contentWidth - labelWidth;
  const wrapped = wrapText(
    value || "____________________________",
    context.font,
    9,
    fieldWidth
  );
  const isLongField =
    field.kind === "textarea" || value.length > 90 || wrapped.length > 1;
  const draftHeight = isLongField ? 64 : 24;
  const draftFontSize = isLongField ? 10 : 12;
  const staticHeight = Math.max(18, wrapped.length * 12 + 4);
  const labelLines = shouldStack
    ? wrapText(labelText, context.bold, 9, contentWidth)
    : [labelText];
  const labelBlockHeight = shouldStack ? labelLines.length * 12 + 4 : 0;
  const rowHeight = shouldStack
    ? labelBlockHeight +
      (context.mode === "draft" ? draftHeight + 8 : staticHeight + 4)
    : context.mode === "draft" ? draftHeight + 8 : staticHeight;

  ensureRoom(context, rowHeight + 12);
  const y = context.y;

  if (shouldStack) {
    labelLines.forEach((line, index) => {
      drawFieldLabel(context, line, y - index * 12);
    });
  } else {
    drawFieldLabel(context, labelText, y);
  }

  const fieldTopY = shouldStack ? y - labelBlockHeight : y;

  if (context.mode === "draft" && context.form) {
    const textField = context.form.createTextField(toPdfFieldName(field.path, context));
    textField.enableMultiline();
    textField.setText(value);
    textField.addToPage(context.page, {
      x: fieldX,
      y: fieldTopY - draftHeight + 7,
      width: fieldWidth,
      height: draftHeight,
      borderColor: rgb(0.66, 0.74, 0.71),
      borderWidth: 0.7,
      backgroundColor: rgb(1, 1, 1),
      textColor: rgb(0.18, 0.25, 0.23),
      font: context.font
    });
    textField.setFontSize(draftFontSize);
    context.y -= rowHeight;
    return;
  }

  wrapped.forEach((line, index) => {
    context.page.drawText(line, {
      x: fieldX,
      y: fieldTopY - index * 12,
      size: 9,
      font: context.font,
      color: rgb(0.18, 0.25, 0.23)
    });
  });
  context.y -= rowHeight;
}

function drawPacketHeader(context: PdfContext) {
  const name = companyName(context.packet);
  const tagline = context.packet.company.tagline || BRAND_PLACEHOLDERS.tagline;
  const logoImage = context.logoImage;
  let textX = margin;
  let headerHeight = 42;

  if (logoImage) {
    const dimensions = logoImage.scaleToFit(78, 34);
    context.page.drawImage(logoImage, {
      x: margin,
      y: context.y - dimensions.height + 2,
      width: dimensions.width,
      height: dimensions.height
    });
    textX = margin + dimensions.width + 12;
    headerHeight = Math.max(headerHeight, dimensions.height + 10);
  }

  context.page.drawText(name, {
    x: textX,
    y: context.y,
    size: 13,
    font: context.bold,
    color: rgb(0.06, 0.46, 0.43)
  });
  context.page.drawText(tagline, {
    x: textX,
    y: context.y - 15,
    size: 9,
    font: context.font,
    color: rgb(0.31, 0.39, 0.37)
  });
  context.y -= headerHeight;
}

async function embedLogoImage(pdfDoc: PDFDocument, logoValue: string) {
  if (!logoValue.startsWith("data:image/")) {
    return null;
  }

  const commaIndex = logoValue.indexOf(",");

  if (commaIndex === -1) {
    return null;
  }

  const header = logoValue.slice(0, commaIndex).toLowerCase();
  const base64Data = logoValue.slice(commaIndex + 1);

  try {
    const bytes = decodeBase64(base64Data);

    if (header.includes("image/png")) {
      return await pdfDoc.embedPng(bytes);
    }

    if (header.includes("image/jpeg") || header.includes("image/jpg")) {
      return await pdfDoc.embedJpg(bytes);
    }
  } catch {
    return null;
  }

  return null;
}

function decodeBase64(base64Data: string) {
  const binary = globalThis.atob(base64Data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function drawText(
  context: PdfContext,
  text: string,
  size: number,
  isBold = false,
  after = 12
) {
  const font = isBold ? context.bold : context.font;
  const lines = wrapText(text, font, size, contentWidth);
  ensureRoom(context, lines.length * (size + 5) + after);
  lines.forEach((line) => {
    context.page.drawText(line, {
      x: margin,
      y: context.y,
      size,
      font,
      color: isBold ? rgb(0.11, 0.16, 0.15) : rgb(0.25, 0.32, 0.3)
    });
    context.y -= size + 5;
  });
  context.y -= after;
}

function ensureRoom(context: PdfContext, needed: number) {
  if (context.y - needed > 70) {
    return;
  }

  context.page = context.pdfDoc.addPage(pageSize);
  context.y = pageSize[1] - margin;
  drawPacketHeader(context);
}

function drawPageNumbers(context: PdfContext) {
  const pages = context.pdfDoc.getPages();
  const footer = companyFooter(context.packet) || companyName(context.packet);

  pages.forEach((page, index) => {
    const text = `${footer} | Page ${index + 1} of ${pages.length}`;
    page.drawLine({
      start: { x: margin, y: 44 },
      end: { x: pageSize[0] - margin, y: 44 },
      thickness: 0.6,
      color: rgb(0.82, 0.87, 0.85)
    });
    page.drawText(text, {
      x: margin,
      y: 28,
      size: 8,
      font: context.font,
      color: rgb(0.36, 0.44, 0.42)
    });
  });
}

function drawDraftWatermark(context: PdfContext) {
  context.pdfDoc.getPages().forEach((page) => {
    page.drawText("DRAFT", {
      x: pageSize[0] - 118,
      y: pageSize[1] - 34,
      size: 16,
      font: context.bold,
      color: rgb(0.75, 0.27, 0.17)
    });
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      return;
    }

    if (line) {
      lines.push(line);
    }
    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [""];
}

function toPdfFieldName(fieldPath: string, context: PdfContext) {
  context.fieldIndex += 1;
  return `${context.fieldIndex}.${fieldPath.replace(/[^a-zA-Z0-9.]+/g, "_")}`;
}

function applyBrand(text: string, packet: IntakePacket) {
  return text
    .replaceAll(BRAND_PLACEHOLDERS.companyName, companyName(packet))
    .replaceAll(
      BRAND_PLACEHOLDERS.therapyProviderName,
      packet.company.therapyProviderName || BRAND_PLACEHOLDERS.therapyProviderName
    )
    .replaceAll(
      BRAND_PLACEHOLDERS.therapyProviderPhone,
      packet.company.therapyProviderPhone || BRAND_PLACEHOLDERS.therapyProviderPhone
    )
    .replaceAll(
      BRAND_PLACEHOLDERS.therapyProviderEmail,
      packet.company.therapyProviderEmail || BRAND_PLACEHOLDERS.therapyProviderEmail
    );
}
